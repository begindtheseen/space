---
id: l05-applicant-tracking-systems
title: "Formatting so a parser reads it correctly"
minutes: 18
covers:
  - "applicant tracking system parsing: no tables, no multi-column layouts, no images, standard headings, PDF"
---

Think about mailing a letter. You can write the most moving letter in the world, but if the address on the envelope is smudged, the sorting machine at the post office cannot read it. The letter never arrives. Nobody writes back to say why. From your side, it looks exactly like the person read your letter and chose not to answer.

The first four lessons of this module assumed a person eventually reads your words. This lesson is about the envelope. Many employers collect applications through software called an **[[applicant tracking system|ats]]**, or **ATS** (said "A-T-S") — a program that stores every application, pulls the text out of each resume, and lets recruiters sort and search it. Before any human sees your top third, your keywords or your quantified bullets, the software has to **parse** your file — break it into pieces it understands, like "this is the Education section" and "this line is a skill". A resume can have perfect content and still fail here, before any of that content is seen.

The word that matters most is *silently*. A **[[parsing failure|silent-failure]]** gives you no error message to fix. It produces an application that goes nowhere, with no reason given. From where you sit, it looks the same as an application that was read carefully and turned down. The only defense against a failure nobody will tell you about is not causing it — which means formatting the file with the same care you gave its content.

::: key
Applicant tracking systems parse plain document structure. Multi-column layouts commonly interleave text, tables lose their alignment, and images contribute nothing. A parsing failure can cause a rejection that you never learn about.
:::

The rest of this lesson takes that key apart, one piece at a time: headings, columns and tables, images, the PDF file itself, and a self-test you can run in two minutes.

## Standard headings

Use the section names every reader — human or software — already expects: **Education, Projects, Experience, Skills**. Not "What I've Built," not "My Journey So Far," not a heading designed to sound different.

Here is why. A creative heading asks whatever is reading the page to *guess* what the section is for. A person guesses well. A program may not — and guessing is exactly the step that fails silently when the reader is software. A standard heading costs you nothing in style, because everything underneath it is still yours. And it removes one whole kind of parsing risk for free.

## No tables, no multi-column layouts

Picture a newspaper page with two columns. Your eye knows to read all the way down the left column, then jump to the top of the right one. You do it without thinking.

A program pulling text out of a file often does not see columns at all. Many extraction methods treat a page as a scatter of text pieces, each pinned at a position given by **[[coordinates|pdf-coordinates]]** — how far across and how far down it sits. Depending on the method, the program may rebuild the reading order by sweeping straight across the page, line by line, the way you would read a single wide paragraph. Then the left and right columns **interleave** — their lines get shuffled together. A line from your Skills column lands right beside a line from your Experience column, mid-thought, as if they were one sentence.

A **table** — a grid of rows and columns of boxes, called cells — has the same risk for the same reason. Each cell's text is placed by position, not in a sequence. The program downstream may or may not rebuild your intended row-by-row order, and the alignment that made the table readable is lost.

### Why not "columns are fine if the software is modern"?

Honestly, this varies. Some extraction methods handle columns and tables correctly. Others do not. From the outside you usually cannot tell which kind you face, and you cannot test it without that exact system in front of you. For any given application, you do not know which system — if any — sits between your file and the first person who opens it.

That uncertainty is the whole reason this lesson gives no "it depends" rule. Design for the least forgiving case:

- one column,
- top to bottom,
- in the order you want it read,
- with no table anywhere on the page.

::: key
Some parsers handle multi-column layouts and tables correctly, and some interleave their content into a garbled stream. Because you cannot know in advance which kind stands between you and a reader for any given application, a single-column, top-to-bottom layout with no tables removes the risk entirely rather than betting on it.
:::

::: example How a two-column layout can scramble
A candidate's resume puts Skills and Education in a narrow left column, and Experience and Projects in a wider right column, side by side down the whole page. On screen it reads cleanly — one column at a time, top to bottom.

**Step 1 — what the program sees.** Not two columns — only pieces of text, each pinned at a position on the page.

**Step 2 — one plausible way it rebuilds the order.** It sweeps across the full width of the page at each height, left to right, before moving down. So at each height it picks up the left-column line first, then the right-column line beside it.

**Step 3 — the result.** The pasted text comes out something like:

"Skills: Python, C++ Senior Project Lead, ACME Robotics Club Education: B.S. in progress Designed a 6-DOF simulation..."

Skills and Education lines are now mixed in with Experience and Projects lines, mid-sentence. Nothing shows where one section ended and the next began. A keyword search might still find "C++" — but "Senior Project Lead" now looks like part of the Skills list.

**Sanity check.** Not every system behaves this way. But a candidate who has not tested her own file cannot know whether hers does. That is the whole argument for avoiding the layout instead of gambling on one system's behavior.
:::

## No images

A headshot. A company or university logo. An icon used in place of a section heading. A **[[QR code|qr-code]]**. The skill-level bar graphic from lesson two. All of these share one property: the information they carry is shown as a picture, not written as text.

A program that pulls out and searches text finds *nothing* in a picture. There are no letters there to find, however meaningful the image looks to a person. So if a piece of information matters — and it very often does — it has to exist on the page as real characters, not as colored dots arranged to look like words or ideas.

This is the general form of the reason lesson two turned down proficiency bars. A graphic can look informative to a person skimming fast while being completely invisible to anything reading the page as text. The fix is the same in both cases: say it in words.

::: key
Anything conveyed only through an image — a headshot, a logo, an icon, a QR code, a proficiency-bar graphic — is invisible to a program reading the document as text, no matter how informative it looks to a person. State the same information in words instead.
:::

## PDF, exported so the text stays text

Send your final resume as a **[[PDF|pdf]]** — a file format that looks the same on every computer. But be precise about what that means, because there are two very different kinds of PDF that look identical.

**Kind one: text PDF.** Made by exporting a normal text document — a word processor file, a LaTeX or other typesetting source, or a web page saved as PDF. The letters stay letters. You can select them, search them, and copy them out, and so can any program downstream.

**Kind two: picture PDF.** Made by scanning a printed page, or by some resume-builder templates that flatten the whole page into one image. On screen it looks exactly like kind one. Inside, there is no text at all — only a picture of text. Reading it would take **[[OCR|ocr]]**, and you should not count on any system doing that for you.

To a person, the two files look the same. To anything reading the file as text, one is a resume and the other is a blank page with a photo on it.

::: warning A perfect-looking PDF can still be empty
Looking at the file, however carefully, cannot tell you whether it holds real text or a picture of text. The only way to know is to check it directly — which is exactly what the self-test below does. Always check before you submit anything.
:::

## The self-test: read what a machine would read

Before you submit any version of your resume, run this check yourself:

1. Open the exported PDF.
2. Select all of its text, and copy it.
3. Paste it into a **[[plain text editor|plain-text]]** — one that shows only characters, with no formatting of its own.
4. Read what comes out, top to bottom, exactly as it appears.

You are checking for three things.

- **Is there any text at all?** An empty or nearly empty paste means you made a picture, not a document. Nothing downstream will do better than your paste did.
- **Is it in the right order?** Headings and content should appear in the order you intended, not shuffled together. This is where a hidden column or table problem shows itself, because your paste follows the same kind of extraction many parsing systems use.
- **Is anything missing?** A text box, a page header, or a graphic element that some tools place outside the normal flow of the document can vanish from a plain text copy, even though it shows up fine on screen.

If the plain text is a faithful, correctly ordered, complete copy of your resume, you have strong evidence the file will hold up wherever it goes. If it is not, you found the problem yourself, at your own desk — instead of losing an application to it without ever knowing.

::: example Running the self-test on a finished resume
A candidate finishes her one-page, single-column resume and exports it to PDF from her word processor.

**Step 1.** She opens the PDF, selects all, copies, and pastes into a plain text editor.

**Step 2.** She reads the paste in order. It shows: her name and contact line, her identity statement, the Education line, each Projects entry with its bullets in order, the Skills categories, and the Experience entry.

**Step 3.** She compares it against the PDF on screen. Every section is there. Nothing is interleaved. Nothing is missing.

**What this proves — and what it does not.** It does not prove every system that ever receives this file will read it the same way; she cannot test every system that exists. It does show that the file itself holds clean, correctly ordered, complete text, with nothing trapped in an image or scrambled by a layout. That removes every *formatting* cause of a silent failure, leaving only factors outside her control.

**Sanity check.** Three questions, three yeses: text present, order right, nothing missing. That is a pass.
:::

## Check yourself

::: check
Why is a parsing failure a more serious problem for an applicant than a merely mediocre bullet or two, even though both might end the same way — with no response?
:::

::: answer
A mediocre bullet is at least read and weighed, even if it does not fully persuade. A parsing failure means the content never reached a reader in usable form at all. Worse, a parsing failure gives no error message, and from the applicant's side it looks the same as an application that was read and declined on its merits. So it cannot be diagnosed and fixed afterward the way weak content can be revised for the next application.
:::

::: check
Explain how a two-column resume can come out garbled when its text is extracted, even though it looks completely normal on screen.
:::

::: answer
Many text-extraction methods treat a page as pieces of text placed at coordinates, rather than following the column structure a human eye tracks without thinking. Depending on the method, the program may rebuild the order by reading straight across the page at each height. That puts a line from the left column next to whatever line in the right column sits at about the same height — producing a jumbled, out-of-order stream even though the original layout was clean and deliberate.
:::

::: check
A proficiency-bar skills graphic and a small university logo near the header seem unrelated, but this lesson treats them as the same problem. What do they have in common?
:::

::: answer
Both carry their information as a picture, not as extractable text. The bar shows a claimed skill level through shaded shapes; the logo shows an affiliation through an image. Neither exists as characters a text-based system can find or search. Anything meaningful that exists only as a picture is invisible to anything reading the document as text, however clear it looks to a person — so both should be replaced with the same information written in words.
:::

::: check
What is the practical difference between a PDF exported from a normal text document and a PDF that is effectively "a picture of text"? Why can a candidate not tell them apart by looking?
:::

::: answer
A PDF from a text source keeps its content as selectable, searchable text that any downstream system can extract exactly as written. A picture-of-text PDF — from a scanner or a template that flattens the page into an image — shows the same characters on screen but contains no underlying text, only pixels shaped like letters. Looking cannot separate them, because both display identically. Only checking whether the text can actually be selected and copied reveals which one you have.
:::

::: check
Describe the self-test a candidate should run on her exported resume before submitting it, and name the three things she is checking for.
:::

::: answer
She opens the exported PDF, selects all its text, copies it, pastes it into a plain text editor with no formatting of its own, and reads what comes out. She checks, first, that real text appears at all instead of an empty paste; second, that headings and content appear in the correct order instead of interleaved fragments from a column or table layout; and third, that nothing is missing that showed on screen but did not survive extraction.
:::

## Summary

| Element | Risk if used | Fix |
| --- | --- | --- |
| Creative section headings | Software may not recognize what the section is | Standard names: Education, Projects, Experience, Skills |
| Multi-column layout or tables | Content can interleave into a garbled, out-of-order stream; tables lose alignment | One column, top to bottom, in your reading order |
| Images: logos, icons, QR codes, proficiency bars | Information shown only as a picture is invisible to text extraction | Say the same thing in plain text |
| Scanned or template-flattened PDF | The file may hold no extractable text at all | Export from a text source; check the text is selectable |
| Unchecked final file | A parsing failure gives no error message, only silence | Select all, copy, paste into a plain text editor before submitting |

The next lesson goes back to content, to a question formatting cannot answer: how to arrange the same true evidence for one specific role family without misrepresenting anything — and when a cover letter is worth the time it costs.

::: context ats What an applicant tracking system is
An **applicant tracking system** is a database for hiring. When you click "submit", your resume, your answers on the form, and the posting you applied to all land in it. Recruiters use it to see every applicant for a posting, search by keyword, move candidates from stage to stage, and record decisions. Big companies can receive a flood of applications for a popular engineering role, so some tool like this sits behind most large company careers pages. What each system does with your file — how it extracts text, whether it ranks or filters — differs by product and by how the company set it up, and you usually cannot see which one you are using.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="6" y="30" width="74" height="36" rx="6" fill="#fff"/>
    <rect x="96" y="30" width="74" height="36" rx="6" fill="#8fb8f0"/>
    <rect x="186" y="30" width="74" height="36" rx="6" fill="#8fb8f0"/>
    <rect x="276" y="30" width="78" height="36" rx="6" fill="#f2b880"/>
    <line x1="80" y1="48" x2="94" y2="48"/><line x1="170" y1="48" x2="184" y2="48"/><line x1="260" y1="48" x2="274" y2="48"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="43" y="52">your PDF</text><text x="133" y="52">parse text</text>
    <text x="223" y="52">search</text><text x="315" y="52">human reads</text>
  </g>
  <text x="133" y="86" font-size="11" text-anchor="middle" fill="#b4232c">fails silently here</text>
</svg>
```
:::

::: context silent-failure Why "silent" is the dangerous part
Engineers fear silent failures more than loud ones. A loud failure — a crash, an alarm — tells you something broke, so you fix it. A silent failure lets everything look fine while the result is wrong. Flight software teams spend enormous effort turning silent failures into loud ones: checks that compare two sensors, tests that must pass before a change is accepted. The self-test in this lesson is the same move for your resume: it turns a failure you would never hear about into one you can see on your own screen.
:::

::: context pdf-coordinates How a PDF actually stores text
Inside a PDF, text is not stored as paragraphs. It is closer to a list of instructions: "put these letters here, at this distance across and this distance down, in this font." There is often nothing that says "this line continues in the next column." A program that wants the text back has to guess the reading order from the positions.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="190" height="130" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#8fb8f0"><rect x="20" y="30" width="60" height="10"/><rect x="20" y="60" width="60" height="10"/><rect x="20" y="90" width="60" height="10"/></g>
  <g fill="#f2b880"><rect x="100" y="30" width="90" height="10"/><rect x="100" y="60" width="90" height="10"/><rect x="100" y="90" width="90" height="10"/></g>
  <g font-size="11" fill="#1f2a44"><text x="20" y="130">left</text><text x="100" y="130">right</text></g>
  <g stroke="#b4232c" stroke-width="1.5" fill="none">
    <path d="M82,35 L98,35"/><path d="M190,40 L20,58"/><path d="M82,65 L98,65"/><path d="M190,70 L20,88"/><path d="M82,95 L98,95"/>
  </g>
  <text x="280" y="30" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">read across:</text>
  <g font-size="12" text-anchor="middle">
    <text x="280" y="54" fill="#1d6fd1">left 1</text><text x="280" y="70" fill="#1f2a44">right 1</text>
    <text x="280" y="86" fill="#1d6fd1">left 2</text><text x="280" y="102" fill="#1f2a44">right 2</text>
    <text x="280" y="118" fill="#1d6fd1">left 3</text><text x="280" y="134" fill="#1f2a44">right 3</text>
  </g>
</svg>
```

The red path is the sweep: across, down, across. The two columns come out zipped together.
:::

::: context qr-code Why a QR code does not help
A **QR code** ("quick response" code) is a square of black and white blocks that a phone camera turns into a link. It is handy on a poster. On a resume it is a picture: a program reading text finds nothing in it, and a recruiter at a desk is not going to hold her phone up to her monitor. If you want to share a link — to your repository or portfolio — type it out as text, where both people and programs can use it.
:::

::: context pdf Where PDF comes from
**PDF** stands for **Portable Document Format**. Adobe introduced it in the early 1990s so a document would look the same on any computer and any printer, and it later became an open international standard. "Portable" is the point: fonts and layout travel with the file. That is why PDF is the safe choice for a resume — as long as the text inside is real text, not a picture.
:::

::: context ocr Reading text out of a picture
**OCR**, said "O-C-R", stands for **optical character recognition**: software that looks at a picture of text and guesses which letters it shows. It is how a phone app can copy words off a photo of a sign. It works well on clean scans and badly on small fonts, unusual layouts and graphics. Some systems may run it on a picture-only PDF; many will not. Either way, every guess is a chance for an error, so give the system real text and it has nothing to guess.
:::

::: context plain-text Which editor to paste into
A **plain text editor** shows raw characters only — no fonts, no bold, no columns, no pictures. Notepad on Windows is one. On a Mac, TextEdit works once you switch it to plain text mode (Format, then Make Plain Text). A code editor such as VS Code works too. The point is that the editor adds no layout of its own, so what you see is only what the file really contains — close to what a parsing program gets.
:::
