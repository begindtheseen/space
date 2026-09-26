/* ============================================================================
   The natural voice — making the model fit for the GPU
   ----------------------------------------------------------------------------
   The model is downloaded in its 8-bit form (92 MB), where every convolution
   is a ConvInteger fed by a DynamicQuantizeLinear: the input is quantised on
   the fly, convolved in integers, and scaled back. That runs on the CPU, but
   the GPU runtime has no integer convolution, so on the GPU it would fall
   back to the CPU piece by piece and be slow.

   This rewrites each of those into the plain form — DequantizeLinear on the
   stored 8-bit weights (so the file stays small) feeding an ordinary Conv on
   the float input — which the GPU runs natively. The weights are the same
   numbers; the only difference is that the activations are no longer rounded
   to 8 bits between layers, which brings the sound closer to the full model.

   It works on the ONNX file's protobuf bytes directly: only the handful of
   fields it needs are decoded, and everything else is copied through as it
   was, so nothing it does not understand can be lost.
   ========================================================================== */

type Field = { no: number; wire: number; start: number; end: number; value: number | Uint8Array }

function readVarint(buf: Uint8Array, pos: number): [number, number] {
  let result = 0
  let shift = 0
  for (;;) {
    const b = buf[pos++]!
    result += (b & 0x7f) * 2 ** shift
    if (b < 0x80) return [result, pos]
    shift += 7
  }
}

/** Splits one message into its fields, each with its exact byte range. */
function fields(buf: Uint8Array): Field[] {
  const out: Field[] = []
  let pos = 0
  while (pos < buf.length) {
    const start = pos
    const [key, p1] = readVarint(buf, pos)
    const no = Math.floor(key / 8)
    const wire = key & 7
    pos = p1
    let value: number | Uint8Array
    if (wire === 0) {
      ;[value, pos] = readVarint(buf, pos)
    } else if (wire === 1) {
      value = 0
      pos += 8
    } else if (wire === 5) {
      value = 0
      pos += 4
    } else if (wire === 2) {
      const [len, p2] = readVarint(buf, pos)
      value = buf.subarray(p2, p2 + len)
      pos = p2 + len
    } else {
      throw new Error(`Unsupported protobuf wire type ${wire}`)
    }
    out.push({ no, wire, start, end: pos, value })
  }
  return out
}

const utf8 = new TextDecoder()
const enc = new TextEncoder()
const str = (f: Field) => utf8.decode(f.value as Uint8Array)

function varint(n: number): number[] {
  const out: number[] = []
  while (n >= 0x80) {
    out.push((n % 0x80) | 0x80)
    n = Math.floor(n / 0x80)
  }
  out.push(n)
  return out
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
}

function lengthDelimited(no: number, body: Uint8Array): Uint8Array {
  return concat([Uint8Array.from([...varint(no * 8 + 2), ...varint(body.length)]), body])
}

const stringField = (no: number, s: string) => lengthDelimited(no, enc.encode(s))

interface Node {
  raw: Uint8Array
  inputs: string[]
  outputs: string[]
  op: string
  name: string
  /** The raw attribute fields, copied as they are when a node is rebuilt. */
  attributes: Uint8Array[]
}

function parseNode(raw: Uint8Array): Node {
  const node: Node = { raw, inputs: [], outputs: [], op: '', name: '', attributes: [] }
  for (const f of fields(raw)) {
    if (f.no === 1) node.inputs.push(str(f))
    else if (f.no === 2) node.outputs.push(str(f))
    else if (f.no === 3) node.name = str(f)
    else if (f.no === 4) node.op = str(f)
    else if (f.no === 5) node.attributes.push(raw.subarray(f.start, f.end))
  }
  return node
}

function encodeNode(op: string, name: string, inputs: string[], outputs: string[], attributes: Uint8Array[] = []): Uint8Array {
  return concat([...inputs.map((i) => stringField(1, i)), ...outputs.map((o) => stringField(2, o)), stringField(3, name), stringField(4, op), ...attributes])
}

export interface RewriteReport {
  convs: number
  removed: number
}

/**
 * Rewrites every DynamicQuantizeLinear → ConvInteger → (Add bias) → Cast →
 * Mul(scale) chain into DequantizeLinear(weights) → Conv(float input, weights,
 * float bias). Returns the new model bytes. Throws if the graph is not shaped
 * the way this expects, so a caller can fall back to the model as it was.
 */
export function convIntegerToConv(model: Uint8Array): { bytes: Uint8Array; report: RewriteReport } {
  const top = fields(model)
  const graphField = top.find((f) => f.no === 7 && f.wire === 2)
  if (!graphField) throw new Error('No graph in the model.')
  const graphBytes = graphField.value as Uint8Array
  const graph = fields(graphBytes)

  const initializers = new Set<string>()
  const graphOutputs = new Set<string>()
  const nodes: Node[] = []
  for (const f of graph) {
    if (f.no === 1) nodes.push(parseNode(f.value as Uint8Array))
    else if (f.no === 5) {
      const name = fields(f.value as Uint8Array).find((g) => g.no === 8)
      if (name) initializers.add(str(name))
    } else if (f.no === 12) {
      const name = fields(f.value as Uint8Array).find((g) => g.no === 1)
      if (name) graphOutputs.add(str(name))
    }
  }

  const producer = new Map<string, Node>()
  const consumers = new Map<string, Node[]>()
  for (const n of nodes) {
    for (const o of n.outputs) producer.set(o, n)
    for (const i of n.inputs) consumers.set(i, [...(consumers.get(i) ?? []), n])
  }
  const only = (name: string, op: string): Node => {
    const c = consumers.get(name) ?? []
    if (c.length !== 1 || c[0]!.op !== op) throw new Error(`Unexpected graph after ${name}: ${c.map((n) => n.op).join(', ')}`)
    return c[0]!
  }

  const replaced = new Map<Node, Uint8Array[]>()
  const dropped = new Set<Node>()
  let convs = 0
  for (const ci of nodes) {
    if (ci.op !== 'ConvInteger') continue
    const [xq, wq, , wzp] = ci.inputs as [string, string, string, string]
    const dql = producer.get(xq)
    if (!dql || dql.op !== 'DynamicQuantizeLinear') throw new Error(`ConvInteger ${ci.name} is not fed by DynamicQuantizeLinear.`)
    if (!initializers.has(wq) || !initializers.has(wzp)) throw new Error(`ConvInteger ${ci.name} has computed weights.`)
    const x = dql.inputs[0]!
    let next = (consumers.get(ci.outputs[0]!) ?? [])[0]
    let bias: string | null = null
    const chain: Node[] = [ci]
    if (next?.op === 'Add') {
      chain.push(next)
      // The bias arrives quantised at run time: Reshape(Cast(Floor(Div(bias, scale)))).
      const reshape = producer.get(next.inputs[1]!)
      const cast = reshape && producer.get(reshape.inputs[0]!)
      const floor = cast && producer.get(cast.inputs[0]!)
      const div = floor && producer.get(floor.inputs[0]!)
      if (!div || div.op !== 'Div' || !initializers.has(div.inputs[0]!)) throw new Error(`Unexpected bias for ${ci.name}.`)
      bias = div.inputs[0]!
      next = only(next.outputs[0]!, 'Cast')
    }
    if (next?.op !== 'Cast') throw new Error(`Unexpected graph after ${ci.name}.`)
    chain.push(next)
    const mul = only(next.outputs[0]!, 'Mul')
    chain.push(mul)
    // The scale is (input scale × weight scale); the weight scale is the constant.
    const scaleNode = producer.get(mul.inputs[1]!)
    const wscale = scaleNode?.inputs.find((i) => initializers.has(i))
    if (!scaleNode || scaleNode.op !== 'Mul' || !wscale) throw new Error(`Unexpected scale for ${ci.name}.`)

    const weights = `${ci.name}__weights_float`
    const convAttrs = ci.attributes
    replaced.set(ci, [
      encodeNode('DequantizeLinear', `${ci.name}__dequantize`, [wq, wscale, wzp], [weights]),
      encodeNode('Conv', `${ci.name}__float`, bias ? [x, weights, bias] : [x, weights], [mul.outputs[0]!], convAttrs),
    ])
    for (const n of chain.slice(1)) dropped.add(n)
    convs++
  }
  if (!convs) throw new Error('No integer convolutions to rewrite.')

  // Keep the rewritten nodes in place of the ConvInteger, drop the rest of
  // each chain, then anything no longer used by what remains.
  let kept: { node: Node | null; raw: Uint8Array; outputs: string[]; inputs: string[] }[] = []
  for (const n of nodes) {
    if (dropped.has(n)) continue
    const rewritten = replaced.get(n)
    if (rewritten) {
      for (const raw of rewritten) {
        const p = parseNode(raw)
        kept.push({ node: null, raw, outputs: p.outputs, inputs: p.inputs })
      }
    } else kept.push({ node: n, raw: n.raw, outputs: n.outputs, inputs: n.inputs })
  }
  const before = kept.length
  for (;;) {
    const used = new Set<string>(graphOutputs)
    for (const k of kept) for (const i of k.inputs) used.add(i)
    const next = kept.filter((k) => k.outputs.some((o) => used.has(o)))
    if (next.length === kept.length) break
    kept = next
  }

  // Reassemble the graph: its nodes where the old ones were, every other
  // field exactly as it was.
  const graphParts: Uint8Array[] = []
  let wroteNodes = false
  for (const f of graph) {
    if (f.no === 1) {
      if (!wroteNodes) {
        for (const k of kept) graphParts.push(lengthDelimited(1, k.raw))
        wroteNodes = true
      }
      continue
    }
    graphParts.push(graphBytes.subarray(f.start, f.end))
  }
  const newGraph = concat(graphParts)
  const modelParts: Uint8Array[] = []
  for (const f of top) modelParts.push(f === graphField ? lengthDelimited(7, newGraph) : model.subarray(f.start, f.end))
  return { bytes: concat(modelParts), report: { convs, removed: before - kept.length + dropped.size } }
}

/* ── Word timing: the durations the model already computes ─────────────────
   Before it makes any sound, the model decides how long each phoneme lasts:
   a whole number of 25 ms frames (600 samples) per input token, which it then
   uses to lay the sound out. The published export returns only the waveform,
   so those numbers are thrown away. Listing that tensor as a second output
   costs nothing to compute and gives the exact moment every word starts and
   ends — what the reader highlights as it goes. */

/** The tensor that holds one duration per input token, in frames. */
export const DURATIONS_TENSOR = '/encoder/Gather_output_0'
/** Samples per duration frame at 24 kHz. */
export const SAMPLES_PER_FRAME = 600

/**
 * Adds the per-token durations as a second graph output. Returns the model
 * unchanged when it has no such tensor, or already outputs it.
 */
export function exposeDurations(model: Uint8Array): { bytes: Uint8Array; added: boolean } {
  const top = fields(model)
  const graphField = top.find((f) => f.no === 7 && f.wire === 2)
  if (!graphField) return { bytes: model, added: false }
  const graphBytes = graphField.value as Uint8Array
  const graph = fields(graphBytes)
  let produced = false
  for (const f of graph) {
    if (f.no === 1 && !produced) produced = parseNode(f.value as Uint8Array).outputs.includes(DURATIONS_TENSOR)
    if (f.no === 12) {
      const name = fields(f.value as Uint8Array).find((g) => g.no === 1)
      if (name && str(name) === DURATIONS_TENSOR) return { bytes: model, added: false }
    }
  }
  if (!produced) return { bytes: model, added: false }
  // ValueInfoProto { name: 1, type: 2 → TypeProto { tensor_type: 1 → { elem_type: 1 = INT64 (7) } } }
  const tensorType = new Uint8Array([8, 7])
  const typeProto = lengthDelimited(1, tensorType)
  const valueInfo = concat([stringField(1, DURATIONS_TENSOR), lengthDelimited(2, typeProto)])
  const newGraph = concat([graphBytes, lengthDelimited(12, valueInfo)])
  const modelParts: Uint8Array[] = []
  for (const f of top) modelParts.push(f === graphField ? lengthDelimited(7, newGraph) : model.subarray(f.start, f.end))
  return { bytes: concat(modelParts), added: true }
}
