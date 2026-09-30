---
id: l02-storage-order-and-map
title: Storage order and Map
minutes: 23
covers:
  - Storage order; Map for wrapping an external buffer with no copy
---

Imagine you have to copy a seating chart for a small theater — two rows of three seats — onto one long strip of paper tape. The tape has room for six names in a line, and nothing else. You have a choice. You can write the first row, then the second row. Or you can write down the first column (front seat, back seat), then the second column, then the third. Both tapes hold the same six names. But if someone hands you the tape without saying which way you wrote it, they will seat everyone in the wrong place.

Computer memory is that tape. It is one long line of numbered boxes, and a matrix is a rectangle. Every matrix library must decide how to lay its rectangle along the line, and that choice is called **storage order**. Most of the time you never see it. The moment you share memory with anything else — a telemetry packet, a hardware buffer, a C array, a NumPy array in a Python test — it decides whether your numbers mean what you think.

This lesson shows Eigen's storage order, how to change it, and then a tool called `Map` that lets Eigen treat memory someone else owns as a matrix, without copying a single number. That is how C++ flight code reads sensor packets in place, and how a Python test harness hands big arrays to a C++ core for free.

## Memory is a line

Recall that `A(i, j)` means row $i$, column $j$, counting from zero. There are two natural ways to put a matrix with $r$ rows and $c$ columns along the line of memory.

- **Column-major order** stores the first column top to bottom, then the second column, and so on. Entry $(i, j)$ sits at position $i + j \cdot r$. Read that as "go down $i$, after skipping $j$ whole columns of $r$ entries each".
- **Row-major order** stores the first row left to right, then the second row, and so on. Entry $(i, j)$ sits at position $i \cdot c + j$: skip $i$ whole rows of $c$ entries, then move $j$ along.

Eigen's default is **column-major**. NumPy's default is row-major, which NumPy calls "C order" because C arrays are laid out that way. This mismatch between the two tools you use most is worth **[[picturing|memory-tape]]** before it ever bites you.

::: key
Eigen stores matrices column-major by default: the entries of column 0, then column 1, and so on. Entry $(i, j)$ of an $r$-row matrix is at offset $i + j \cdot r$. NumPy and C arrays default to row-major, where the offset is $i \cdot c + j$.
:::

::: example Seeing the order in memory
Every Eigen matrix has `.data()`, a pointer to its first number. Walking that pointer shows the real layout.

```cpp fragment
#include <Eigen/Dense>
#include <iostream>

template <typename M>
void show_memory(const char* name, const M& m) {
    std::cout << name << " memory:";
    for (int k = 0; k < m.size(); ++k) std::cout << ' ' << m.data()[k];
    std::cout << "\n";
}

int main() {
    Eigen::Matrix<double, 2, 3> A;                   // default: column-major
    A << 1, 2, 3,
         4, 5, 6;

    Eigen::Matrix<double, 2, 3, Eigen::RowMajor> B = A;   // same numbers

    std::cout << "A =\n" << A << "\n";
    show_memory("A (ColMajor)", A);
    show_memory("B (RowMajor)", B);
    std::cout << "A(1,2) = " << A(1, 2) << ", B(1,2) = " << B(1, 2) << "\n";
    std::cout << "A.IsRowMajor = " << A.IsRowMajor
              << ", B.IsRowMajor = " << B.IsRowMajor << "\n";
    return 0;
}
```

```text
A =
1 2 3
4 5 6
A (ColMajor) memory: 1 4 2 5 3 6
B (RowMajor) memory: 1 2 3 4 5 6
A(1,2) = 6, B(1,2) = 6
A.IsRowMajor = 0, B.IsRowMajor = 1
```

Four things to notice.

1. The comma initializer still took the numbers row by row, and printing still shows rows. Those follow the reading order on paper, whatever the storage.
2. In `A`'s memory, the first column $(1, 4)$ comes first, then $(2, 5)$, then $(3, 6)$. That is column-major.
3. Check the formula on `A(1, 2)`: $r = 2$, so the offset is $1 + 2 \cdot 2 = 5$, and position 5 (counting from zero) of `1 4 2 5 3 6` is $6$. For `B` the offset is $1 \cdot 3 + 2 = 5$ as well, and position 5 of `1 2 3 4 5 6` is also $6$. Same answer, different route.
4. `B = A` copied between the two orders, and Eigen rearranged the numbers so that every entry kept its meaning. Mixing orders in ordinary Eigen code is safe; Eigen does the bookkeeping.
:::

The fourth template parameter spot, after the scalar type, the rows and the columns, holds options. `Eigen::RowMajor` asks for row-major storage. You can give the type a name so it is short to use:

```cpp
using RowMajor3d = Eigen::Matrix<double, 3, 3, Eigen::RowMajor>;
```

A column vector has only one column, so there is nothing to choose, and Eigen refuses the option there: `Matrix<double, 3, 1, Eigen::RowMajor>` fails to compile with `INVALID_MATRIX_TEMPLATE_PARAMETERS`.

Why is column-major the default at all? Much of the world's serious numerical code descends from **[[Fortran|fortran-order]]**, which stores arrays column by column, and linear algebra libraries kept that habit. Eigen follows it.

### When the order matters for speed

Inside Eigen, the order mostly takes care of itself. It matters when *you* write a loop over a big dynamic matrix. The processor fetches memory in small chunks called **[[cache lines|cache-line]]**, so walking memory in order is fast and hopping around is slow. For a column-major matrix, the fast way is to walk down each column: put the row index $i$ in the inner loop. For a row-major matrix it is the opposite. For the tiny fixed-size matrices of attitude code the difference is negligible, but for a large simulation grid it can be several times.

## Map: a view onto memory you already have

Picture a clear plastic grid laid over a page of numbers in someone else's notebook. Through the grid you can read the numbers as a table, and with a pen you can even change them. But you have not copied the page, and when you lift the grid off, the notebook is exactly where it was.

`Eigen::Map` is that plastic grid. A **Map** — a view that makes an existing block of memory look like an Eigen matrix or vector — holds only a pointer to the memory and its sizes. It owns nothing, allocates nothing and copies nothing. Every Eigen operation works on it: products, norms, blocks, solvers.

The basic forms:

- `Eigen::Map<Eigen::Vector3d> v(ptr);` views three doubles starting at `ptr` as a `Vector3d`. Reading `v` reads that memory; writing `v` writes it.
- `Eigen::Map<const Eigen::Vector3d> v(ptr);` is the read-only version. Trying to write through it will not compile.
- `Eigen::Map<Eigen::MatrixXd> M(ptr, rows, cols);` is the dynamic-size form: you pass the sizes when you make it.
- The storage order comes from the type inside: `Map<RowMajor3d>` reads the memory row by row.

::: key
`Eigen::Map` views an existing raw buffer as an Eigen matrix or vector without copying. It is how you wrap a DMA buffer, a message payload or a NumPy array crossing a pybind11 boundary.
:::

Where does such memory come from in a vehicle? A **[[DMA buffer|dma-buffer]]**, filled directly by a sensor's hardware. A radio message, decoded into a struct of plain `double`s. A block of shared memory another process writes. In each case the numbers are already sitting there, and copying them only to do some math would waste time. In a tight loop, every copy is also one more thing to go wrong.

::: example Reading an IMU packet in place
An **IMU** (inertial measurement unit — the box of accelerometers and gyroscopes that feels how the vehicle moves) sends a packet of six doubles. Here Eigen does its math directly inside the packet.

```cpp fragment
#include <Eigen/Dense>
#include <iostream>

// A telemetry packet as it arrives from the radio: plain doubles.
struct ImuPacket {
    double accel[3];        // m/s^2
    double gyro[3];         // rad/s
};

int main() {
    ImuPacket pkt{{0.12, -0.05, 9.79}, {0.001, 0.002, -0.0005}};

    // View the accelerometer numbers as a Vector3d. Nothing is copied.
    Eigen::Map<Eigen::Vector3d> accel(pkt.accel);
    std::cout << "same address? " << (accel.data() == pkt.accel) << "\n";
    std::cout << "|accel| = " << accel.norm() << " m/s^2\n";

    // Writing through the Map writes into the packet itself.
    accel.z() -= 9.80665;                         // remove standard gravity
    std::cout << "pkt.accel[2] is now " << pkt.accel[2] << "\n";

    // A read-only view uses a const type.
    Eigen::Map<const Eigen::Vector3d> gyro(pkt.gyro);
    std::cout << "gyro = " << gyro.transpose() << " rad/s\n";
    return 0;
}
```

```text
same address? 1
|accel| = 9.79086 m/s^2
pkt.accel[2] is now -0.01665
gyro =   0.001   0.002 -0.0005 rad/s
```

Step by step:

1. `accel.data() == pkt.accel` printed `1`, meaning true: the Map's numbers *are* the packet's numbers, at the same address.
2. The length is $\sqrt{0.12^2 + 0.05^2 + 9.79^2} \approx 9.79086\,\mathrm{m/s^2}$. That is close to Earth's gravity, which makes sense for a vehicle sitting still on the pad.
3. Subtracting standard gravity, $g_0 = 9.80665\,\mathrm{m/s^2}$, through the Map changed the packet: $9.79 - 9.80665 = -0.01665$, and that is what `pkt.accel[2]` now holds.
4. The gyro view is `const`. A line like `gyro.x() = 0;` would be rejected by the compiler.
:::

::: warning A Map does not keep its memory alive
A Map is only a pointer and sizes. If the buffer it points to is freed, goes out of scope, or is reused for the next packet, the Map now views garbage, and nothing will warn you. Make each Map live no longer than its buffer. The same rule holds for C++20's `std::span` and for every other kind of view.
:::

### Map and storage order together

A Map has no way to know how the memory was written. It trusts its type. If the memory was written row by row and your Map type is the default column-major, every number is read from the wrong seat.

::: example The same nine numbers, two answers
A rotation matrix arrives as nine doubles written row by row — the way a C array, a JSON file or a NumPy array would store it. The matrix turns vectors 90° about the $z$ axis, so it should turn the $x$ axis into the $y$ axis.

```cpp fragment
#include <Eigen/Dense>
#include <iostream>

using RowMajor3d = Eigen::Matrix<double, 3, 3, Eigen::RowMajor>;

int main() {
    // A 90-degree turn about z, written row by row, the way C and NumPy store it.
    double buf[9] = { 0, -1, 0,
                      1,  0, 0,
                      0,  0, 1 };
    Eigen::Vector3d x_axis(1, 0, 0);

    Eigen::Map<const Eigen::Matrix3d> wrong(buf);   // reads it column by column
    Eigen::Map<const RowMajor3d>      right(buf);   // reads it row by row

    std::cout << "wrong * x = " << (wrong * x_axis).transpose() << "\n";
    std::cout << "right * x = " << (right * x_axis).transpose() << "\n";
    return 0;
}
```

```text
wrong * x =  0 -1  0
right * x = 0 1 0
```

The right answer is $(0, 1, 0)$: the $x$ axis turned a quarter-turn toward $y$. The wrong Map read each row as a column, which gives the **transpose** of the matrix (rows and columns swapped). For a rotation, the transpose is the rotation the *other way*, so the vector went to $(0, -1, 0)$: a quarter-turn in the wrong direction. Nothing crashed. The numbers look perfectly reasonable. Only a test with a known answer catches it.
:::

::: warning The silent transpose
Wrapping row-major memory in a default (column-major) Map gives you the transpose. For a rotation that means the opposite rotation; for a general matrix it means a different matrix. Whenever memory crosses from C arrays, messages or NumPy into Eigen, write the storage order into the Map type on purpose, and test with a matrix that is not symmetric, so a transpose would show.
:::

### Maps with gaps

Sometimes the numbers you want are spread out with others in between. A buffer might interleave two sensors: $a_0, b_0, a_1, b_1, a_2, b_2$. A Map can take a **stride** — the step, in numbers, from one entry to the next — and view every other number as a **[[vector with gaps|stride-picture]]**:

```cpp fragment
#include <Eigen/Dense>
#include <iostream>

int main() {
    // Two sensors interleaved: a0 b0 a1 b1 a2 b2
    double buf[6] = {1.0, 10.0, 2.0, 20.0, 3.0, 30.0};
    Eigen::Map<const Eigen::Vector3d, 0, Eigen::InnerStride<2>> a(buf);
    Eigen::Map<const Eigen::Vector3d, 0, Eigen::InnerStride<2>> b(buf + 1);
    std::cout << "a = " << a.transpose() << "\nb = " << b.transpose() << "\n";
    return 0;
}
```

```text
a = 1 2 3
b = 10 20 30
```

`InnerStride<2>` says "step two doubles each time". The `0` before it is the alignment option; leave it at `0`, which means "make no promise about alignment" (lesson 11 explains alignment).

## Across the Python boundary

A common way to build GNC software is a C++ core — the filter, the guidance law — driven by a Python harness that runs thousands of **[[Monte Carlo|monte-carlo]]** cases, plots the results and checks them against limits. The data moving between them can be large: a whole run's worth of samples. Copying it at every call would be slow, and copying it silently can hide bugs.

The usual bridge is **[[pybind11|pybind11]]**, a C++ library that makes C++ functions callable from Python. A NumPy array is, underneath, a pointer to a buffer of numbers plus a shape and strides. So the C++ side can wrap that buffer in an `Eigen::Map`, and Python and C++ are looking at the same memory.

::: example A C++ function that edits a NumPy array in place
The C++ side converts a block of accelerometer samples from $g$ to $\mathrm{m/s^2}$. It asks pybind11 for the NumPy array's buffer, then maps it. Because NumPy arrays are row-major by default, the Map type is row-major too.

```cpp
#include <pybind11/pybind11.h>
#include <pybind11/numpy.h>
#include <Eigen/Dense>

namespace py = pybind11;
using RowMatrixXd =
    Eigen::Matrix<double, Eigen::Dynamic, Eigen::Dynamic, Eigen::RowMajor>;

// Convert a block of accelerometer samples from g to m/s^2, in place.
// The NumPy array's own memory is viewed through a Map: no copy is made.
void g_to_si(py::array_t<double, py::array::c_style> samples) {
    auto info = samples.request();                 // shape, pointer, strides
    if (info.ndim != 2) throw std::runtime_error("need a 2-D array");
    Eigen::Map<RowMatrixXd> m(static_cast<double*>(info.ptr),
                              info.shape[0], info.shape[1]);
    m *= 9.80665;
}

PYBIND11_MODULE(imu_core, mod) {
    mod.def("g_to_si", &g_to_si, py::arg("samples").noconvert());
}
```

Build it as a Python extension module (with `pybind11` installed for this Python):

```text
g++ -std=c++20 -O2 -Wall -Wextra -shared -fPIC $(python3 -m pybind11 --includes) \
    -I/usr/include/eigen3 imu_core.cpp -o imu_core$(python3 -m pybind11 --extension-suffix)
```

And drive it from Python:

```python
import numpy as np
import imu_core

a = np.array([[0.01, -0.02, 1.00],
              [0.00,  0.03, 0.99]])       # two samples, in g
print("before:", a[0])
imu_core.g_to_si(a)                        # C++ changes a itself
print("after: ", a[0])
print("dtype", a.dtype, "C-contiguous", a.flags["C_CONTIGUOUS"])
```

```text
before: [ 0.01 -0.02  1.  ]
after:  [ 0.0980665 -0.196133   9.80665  ]
dtype float64 C-contiguous True
```

The function returned nothing, yet `a` changed: the C++ code wrote into NumPy's own buffer. Check one number: $-0.02 \times 9.80665 = -0.196133$, as printed. The last line confirms why the Map was allowed: the array holds 64-bit floats (`float64`, which is C++ `double`) and is **C-contiguous** — row-major with no gaps.
:::

That `.noconvert()` is doing important work. Without it, pybind11 is helpful in a dangerous way. Handed an array of the wrong kind — integers, or a column-major array — it quietly makes a converted *copy*, and the C++ function edits the copy. Built without `.noconvert()`, this Python:

```python
b = np.array([[0, 0, 1]])                  # integers, not float64
imu_core.g_to_si(b)
print("int array after:", b[0])

c = np.asfortranarray(np.array([[0.0, 0.0, 1.0], [0.0, 0.0, 1.0]]))
imu_core.g_to_si(c)
print("column-major array after:", c[0])
```

prints

```text
int array after: [0 0 1]
column-major array after: [0. 0. 1.]
```

— two arrays that the function "converted", with nothing changed and no error. With `.noconvert()`, the same call fails loudly instead:

```text
TypeError: g_to_si(): incompatible function arguments. The following argument types are supported:
    1. (samples: numpy.typing.NDArray[numpy.float64]) -> None

Invoked with: array([[0, 0, 1]])
```

A loud error you can fix beats a silent copy every time.

pybind11 also has a ready-made bridge for Eigen in the header `pybind11/eigen.h`. With it, you can write the parameter as `Eigen::Ref<RowMatrixXd>`, and pybind11 builds the Map over the NumPy buffer for you. A writable `Ref` refuses arrays it cannot view directly, raising the same kind of `TypeError`, so it gives the same safety with less code. Lesson 12 comes back to the whole Eigen-to-NumPy mapping.

::: warning Know when you are sharing and when you are copying
Across a language boundary, "it worked" can mean "it worked on a copy". For in-place work, require the exact type and layout (`float64`, C-contiguous, or whatever your Map type says), make the binding refuse anything else, and test that the caller's array really changed.
:::

## Check yourself

::: check
A column-major `Matrix<double, 4, 3>` has its numbers at `data()[0]` through `data()[11]`. At which offset is entry $(2, 1)$? Where would it be if the matrix were row-major?
:::

::: answer
Column-major: offset $= i + j \cdot r = 2 + 1 \cdot 4 = 6$. You skip one whole column of 4 entries, then go down 2. Row-major: offset $= i \cdot c + j = 2 \cdot 3 + 1 = 7$. You skip two whole rows of 3 entries, then move 1 along. Same entry, different place in memory.
:::

::: check
You write `Eigen::Matrix<double, 2, 3, Eigen::RowMajor> B = A;` where `A` is a default `Matrix<double, 2, 3>`. Does `B(1, 0)` equal `A(1, 0)`? Does `B.data()[1]` equal `A.data()[1]`?
:::

::: answer
`B(1, 0)` equals `A(1, 0)`: assignment between storage orders keeps every entry's meaning, and Eigen rearranges the memory to do it. But `B.data()[1]` and `A.data()[1]` are generally different. In column-major `A`, offset 1 is entry $(1, 0)$, the second number of the first column. In row-major `B`, offset 1 is entry $(0, 1)$, the second number of the first row. For the matrix in the lesson those were $4$ and $2$.
:::

::: check
A message struct has a member `double q_cov[9]` holding a $3 \times 3$ covariance written row by row. Write a read-only Eigen view of it, and say why, for this particular matrix, the storage order would not change the numbers you read — and why you should still write it correctly.
:::

::: answer
`Eigen::Map<const Eigen::Matrix<double, 3, 3, Eigen::RowMajor>> P(msg.q_cov);` A covariance matrix is **symmetric** — entry $(i, j)$ equals entry $(j, i)$ — so reading it transposed gives the same matrix, and a column-major Map would happen to work. But code gets copied: the next person reuses the line for a rotation matrix or a Jacobian, which is not symmetric, and gets the silent transpose. Writing the true storage order costs nothing and keeps the code right for every matrix.
:::

::: check
What is wrong with this function?

```cpp
Eigen::Map<Eigen::Vector3d> latest_accel() {
    double buf[3];
    read_sensor(buf);
    return Eigen::Map<Eigen::Vector3d>(buf);
}
```
:::

::: answer
`buf` is a local array: it lives on the stack only until the function returns. The Map returned holds a pointer to that dead memory, so every read of it afterwards is undefined behavior — it might even look right for a while, until the next function call overwrites that stack space. A Map never owns or extends the life of its memory. Return a `Vector3d` by value instead (a copy of three doubles costs almost nothing), or have the caller pass in a buffer that outlives the view.
:::

::: check
A Python Monte Carlo harness passes a float64 array of shape $(10000, 6)$ to a C++ function that fills it with simulated states. A teammate reports the harness "works" but every row stays zero. The array was made with `np.zeros((6, 10000)).T`. What happened?
:::

::: answer
`np.zeros((6, 10000))` is row-major, and `.T` does not move any data: it returns a view with the strides swapped, so the $(10000, 6)$ array is actually column-major in memory (NumPy calls this F-contiguous) and is not C-contiguous. The binding asked for a C-contiguous array, and without `.noconvert()` pybind11 made a converted copy, the C++ function filled the copy, and the copy was thrown away. The fix is to make the array in the layout the function expects (`np.zeros((10000, 6))`, or `np.ascontiguousarray`) and to add `.noconvert()` so a wrong layout raises `TypeError` instead of failing quietly.
:::

## Summary

| Idea | Meaning | Fact to remember |
|---|---|---|
| storage order | how a rectangle of numbers is laid along memory | invisible until you touch raw memory |
| column-major | column 0, then column 1, … | Eigen's default; offset $i + j \cdot r$ |
| row-major | row 0, then row 1, … | NumPy and C default; offset $i \cdot c + j$ |
| `Eigen::RowMajor` | option in the template's fourth slot | `Matrix<double, 3, 3, Eigen::RowMajor>` |
| `Map<T>` | a view of existing memory as an Eigen object | no copy, no allocation, no ownership |
| `Map<const T>` | a read-only view | writes will not compile |
| stride | step between entries in a Map | `InnerStride<2>` for interleaved data |
| wrong order in a Map | gives the transpose, silently | test with a non-symmetric matrix |
| pybind11 bridge | Map over the NumPy buffer; `Eigen::Ref` does it for you | use `.noconvert()` so wrong layouts fail loudly |

The next lesson, *Block operations*, uses the same idea of a view inside a single matrix: pulling out a corner, a row, a column or a stretch of a vector — the position half of a state vector, the velocity block of a covariance — and reading or writing it without copying.

::: context memory-tape One matrix, two tapes
The same $2 \times 3$ matrix laid along memory both ways. The numbers in the boxes are the entries; the small gray numbers are the offsets.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#ffffff">
    <rect x="130" y="10" width="30" height="24"/><rect x="160" y="10" width="30" height="24"/><rect x="190" y="10" width="30" height="24"/>
    <rect x="130" y="34" width="30" height="24"/><rect x="160" y="34" width="30" height="24"/><rect x="190" y="34" width="30" height="24"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="145" y="27">1</text><text x="175" y="27">2</text><text x="205" y="27">3</text>
    <text x="145" y="51">4</text><text x="175" y="51">5</text><text x="205" y="51">6</text>
  </g>
  <text x="20" y="98" font-size="11" fill="#1f2a44">column-major</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="110" y="82" width="36" height="24" fill="#8fb8f0"/><rect x="146" y="82" width="36" height="24" fill="#8fb8f0"/>
    <rect x="182" y="82" width="36" height="24" fill="#f2b880"/><rect x="218" y="82" width="36" height="24" fill="#f2b880"/>
    <rect x="254" y="82" width="36" height="24" fill="#ffffff"/><rect x="290" y="82" width="36" height="24" fill="#ffffff"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="128" y="99">1</text><text x="164" y="99">4</text><text x="200" y="99">2</text><text x="236" y="99">5</text><text x="272" y="99">3</text><text x="308" y="99">6</text>
  </g>
  <text x="20" y="158" font-size="11" fill="#1f2a44">row-major</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="110" y="142" width="36" height="24" fill="#8fb8f0"/><rect x="146" y="142" width="36" height="24" fill="#8fb8f0"/><rect x="182" y="142" width="36" height="24" fill="#8fb8f0"/>
    <rect x="218" y="142" width="36" height="24" fill="#f2b880"/><rect x="254" y="142" width="36" height="24" fill="#f2b880"/><rect x="290" y="142" width="36" height="24" fill="#f2b880"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="128" y="159">1</text><text x="164" y="159">2</text><text x="200" y="159">3</text><text x="236" y="159">4</text><text x="272" y="159">5</text><text x="308" y="159">6</text>
  </g>
  <g font-size="11" text-anchor="middle" fill="#6c7a93">
    <text x="128" y="122">0</text><text x="164" y="122">1</text><text x="200" y="122">2</text><text x="236" y="122">3</text><text x="272" y="122">4</text><text x="308" y="122">5</text>
    <text x="128" y="182">0</text><text x="164" y="182">1</text><text x="200" y="182">2</text><text x="236" y="182">3</text><text x="272" y="182">4</text><text x="308" y="182">5</text>
  </g>
</svg>
```

The colors mark the groups: whole columns on the top tape, whole rows on the bottom one.
:::

::: context fortran-order Where column-major comes from
Fortran, one of the first high-level programming languages, first released by IBM in 1957, stores a two-dimensional array column by column. Decades of scientific and engineering code were written in it, including the reference versions of BLAS and LAPACK, the standard libraries for vector and matrix arithmetic and for solving linear systems. MATLAB kept the same order.

So in numerical linear algebra, column-major is the traditional layout, and Eigen matches it. That also lets Eigen hand its matrices straight to an optimized BLAS or LAPACK library when a project asks it to, with no rearranging.
:::

::: context cache-line Why walking memory in order is fast
Main memory is far slower than the processor. To hide that, the processor keeps small, fast copies of recently used memory in a **cache**, and it always fetches memory in fixed chunks called cache lines — 64 bytes on typical desktop processors, room for eight doubles.

If your loop reads the next double in memory, the next seven are usually already in the cache: one slow fetch, eight fast reads. If your loop jumps a whole column's length each step, every read may need a new line. For large matrices that can make the same arithmetic several times slower.
:::

::: context dma-buffer Memory the hardware fills by itself
DMA stands for direct memory access. A sensor interface or radio can copy incoming data straight into a region of memory without the processor moving each byte. When the transfer finishes, the processor is told the buffer is ready.

Flight computers use DMA so the processor spends its time on guidance and control instead of shoveling bytes. Wrapping the finished buffer in a Map lets the control code read it as vectors immediately. The catch is timing: the hardware may start refilling the buffer for the next sample, so the code must finish with the Map, or copy what it needs, before that happens.
:::

::: context stride-picture Stepping over the other sensor's numbers
With a stride of 2, the Map for sensor A starts at offset 0 and steps two doubles at a time; the Map for sensor B starts at offset 1.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="40" y="50" width="46" height="28" fill="#8fb8f0"/><rect x="86" y="50" width="46" height="28" fill="#f2b880"/>
    <rect x="132" y="50" width="46" height="28" fill="#8fb8f0"/><rect x="178" y="50" width="46" height="28" fill="#f2b880"/>
    <rect x="224" y="50" width="46" height="28" fill="#8fb8f0"/><rect x="270" y="50" width="46" height="28" fill="#f2b880"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="63" y="69">1</text><text x="109" y="69">10</text><text x="155" y="69">2</text><text x="201" y="69">20</text><text x="247" y="69">3</text><text x="293" y="69">30</text>
  </g>
  <g fill="none" stroke="#1d6fd1" stroke-width="2">
    <path d="M63,48 C80,22 138,22 155,48"/><path d="M155,48 C172,22 230,22 247,48"/>
  </g>
  <text x="155" y="18" font-size="11" text-anchor="middle" fill="#1d6fd1">A: step 2</text>
  <g fill="none" stroke="#b4232c" stroke-width="2">
    <path d="M109,80 C126,106 184,106 201,80"/><path d="M201,80 C218,106 276,106 293,80"/>
  </g>
  <text x="201" y="122" font-size="11" text-anchor="middle" fill="#b4232c">B: start at 1, step 2</text>
</svg>
```

Neither sensor's data is moved or copied. Each Map only knows where to start and how far to step.
:::

::: context monte-carlo Thousands of flights before the first one
A Monte Carlo analysis runs the same simulation many times, each with slightly different random inputs: sensor noise, engine thrust a percent high or low, wind, mass properties. The spread of outcomes shows how often the design still works, and how badly it fails when it does not.

Aerospace teams lean on it heavily. A common pattern is to write the flight algorithms in C++ — the code that will fly — and drive them from Python, which is convenient for generating cases, storing results and plotting. The boundary between the two gets crossed millions of times, so passing arrays without copying matters.
:::

::: context pybind11 A bridge between C++ and Python
pybind11 is a free, header-only C++ library for exposing C++ functions and classes to Python. You describe what to expose in a `PYBIND11_MODULE` block, compile it as a shared library with a special file name, and Python can `import` it like any module.

It understands NumPy arrays through Python's buffer protocol, a standard way for an object to say "here is a pointer to my data, my element type, my shape and my strides". That description is exactly what an `Eigen::Map` needs, which is why the two fit together so well. The optional header `pybind11/eigen.h` adds automatic conversions for Eigen types.
:::
