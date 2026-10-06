---
title: Object-Oriented Programming
number: 9.
weight: 2400
---

Teascript supports object-oriented programming through classes. A class defines a blueprint for creating objects, bundling together data and the functions that operate on it. This chapter covers how to define classes, construct instances, write methods, and build class hierarchies through inheritance.

That said, Teascript is a multi-paradigm language. Classes are a tool, not a requirement. Many programs are better expressed as a collection of functions operating on plain data — lists, maps, and simple values. Reaching for a class because it feels more structured, when a function and a map would do, often adds ceremony without benefit. The chapters in Part II cover the data structures and module system that make function-oriented design natural in Teascript. This chapter is about when objects genuinely help.

## Classes

A class is declared with the `class` keyword followed by a name and a body enclosed in curly braces:

```tea
class Point
{
    new(x, y)
    {
        self.x = x
        self.y = y
    }

    function tostring()
    {
        return "(${self.x}, ${self.y})"
    }
}
```

A class declaration introduces a new name into the current scope. The name refers to the class itself, which is an object and can be stored, passed, and used like any other value. Instances are created by calling `.new()` on the class:

```tea
var p = Point.new(3, 4)
print(p)    // (3, 4)
```

Inside any method, `self` refers to the current instance. Fields are introduced simply by assigning to `self.name` — there is no separate field declaration syntax.

## Constructor

The constructor is a special method named `new`. It is called when an instance is created via `ClassName.new(...)`, and is responsible for initializing the instance's fields.

```tea
class Circle
{
    new(radius = 1)
    {
        self.radius = radius
    }
}

var unit = Circle.new()
var big = Circle.new(10)
```

Constructor parameters follow the same rules as regular function parameters: positional first, then defaults, then an optional variadic. The constructor does not need to return anything — it implicitly returns the newly created instance. The only permitted use of `return` inside `new` is a bare `return` or an explicit `return self`, both of which are equivalent.

## Methods

Instance methods are declared with the `function` keyword inside the class body. Inside a method, `self` is implicitly available and refers to the instance the method was called on.

```tea
class Rectangle
{
    new(width, height)
    {
        self.width = width
        self.height = height
    }

    function area()
    {
        return self.width * self.height
    }

    function scale(factor)
    {
        self.width *= factor
        self.height *= factor
    }
}

var r = Rectangle.new(3, 4)
print(r.area())     // 12
r.scale(2)
print(r.area())     // 48
```

Static methods belong to the class itself rather than to any instance, and are declared with the `static` keyword. They do not receive `self`:

```tea
class MathUtils
{
    static function clamp(x, lo, hi)
    {
        if x < lo { return lo }
        if x > hi { return hi }
        return x
    }
}

print(MathUtils.clamp(15, 0, 10))   // 10
```

## Special Methods

### get / set

Getter and setter methods allow a class to expose computed properties that look like field accesses to the outside. A getter is written as a name followed by a block:

```tea
fahrenheit
{
    return self.celsius * 9 / 5 + 32
}
```

A setter uses `name=(param)` and receives the assigned value as an explicit argument:

```tea
fahrenheit=(value)
{
    self.celsius = (value - 32) * 5 / 9
}
```

Together they form a computed property that is indistinguishable from a plain field at the call site:

```tea
class Temperature
{
    new(celsius)
    {
        self.celsius = celsius
    }

    fahrenheit
    {
        return self.celsius * 9 / 5 + 32
    }

    fahrenheit=(value)
    {
        self.celsius = (value - 32) * 5 / 9
    }
}

var t = Temperature.new(100)
print(t.fahrenheit)     // 212.0
t.fahrenheit = 32
print(t.celsius)        // 0.0
```

A getter without a corresponding setter produces a read-only property. Attempting to assign to it is an error.

### getattr / setattr

For more dynamic attribute access, a class can define `getattr` and `setattr` methods, which intercept any field access or assignment that does not resolve to a known method or field on the instance. They effectively override the dot operator for unknown names.

`getattr` receives the name being accessed as a string and should return the corresponding value:

```tea
class Proxy
{
    new()
    {
        self.data = {}
    }

    getattr(name)
    {
        return self.data[name]
    }

    setattr(name, value)
    {
        self.data[name] = value
    }
}

var p = Proxy.new()
p.foo = 42
print(p.foo)    // 42
```

`setattr` receives both the name and the value being assigned. These methods are suited for dynamic or reflective patterns — wrapping external data, building proxy objects, or implementing attribute-based DSLs. As with operator overloading, they should be used when the abstraction genuinely earns the indirection. Intercepting all attribute access on an ordinary class obscures what fields an object actually has, which makes code harder to follow.

### call

Defining an `operator ()` method makes instances of the class callable — they can be invoked with function call syntax `instance(args)`:

```tea
class Multiplier
{
    new(factor)
    {
        self.factor = factor
    }

    operator ()(...args)
    {
        return args.map((x) => x * self.factor)
    }
}

var triple = Multiplier.new(3)
print(triple(2, 4, 6))  // [6, 12, 18]
```

### Operator Overloading

Teascript allows classes to define the behavior of built-in operators through `operator` declarations. An operator method is written as `operator <op> (params) { body }`.

Binary operators receive both operands as explicit parameters, which allows the method to inspect types on either side and handle mixed cases. Unary operators receive a single operand. The `-` operator is special in that it covers both the binary subtraction and unary negation cases within a single method declaration. When used as a unary operator, the second parameter receives `nil`, which can be tested to distinguish the two forms:

```tea
operator - (a, b)
{
    if not b { return Vector.new(-a.x, -a.y) }
    return Vector.new(a.x - b.x, a.y - b.y)
}
```

Compound assignment operators like `+=` or `*=` are not overloaded separately — they are derived automatically from the corresponding binary operator. The expression `a += b` is evaluated as `a = a + b`, but importantly, `a` is only evaluated once. This means that subscript compound assignment such as `v[0] += 5` evaluates `v[0]` once, calls the `+` operator, and then calls `[]=` with the result. There is no need to do anything special to support compound assignment; it follows from overloading the base operator.

Overloading `==` automatically provides `!=` as its negation. There is no need to define it separately.

The subscript operators `[]` and `[]=` handle indexed read and write access. Together with compound assignment derivation, overloading both is sufficient to support all subscript forms.

The following example implements a two-dimensional vector type:

```tea
class Vector
{
    new(x = 0, y = 0)
    {
        self.x = x
        self.y = y
    }

    operator + (a, b)
    {
        assert(a is Vector and b is Vector, "wrong argument type")
        return Vector.new(a.x + b.x, a.y + b.y)
    }

    operator - (a, b)
    {
        if not b { return Vector.new(-a.x, -a.y) }
        assert(a is Vector and b is Vector, "wrong argument type")
        return Vector.new(a.x - b.x, a.y - b.y)
    }

    operator * (a, b)
    {
        if b is Number { return Vector.new(a.x * b, a.y * b) }
        assert(a is Vector and b is Vector, "wrong argument type")
        return Vector.new(a.x * b.x, a.y * b.y)
    }

    operator / (a, b)
    {
        assert(a is Vector and b is Vector, "wrong argument type")
        return Vector.new(a.x / b.x, a.y / b.y)
    }

    operator == (a, b)
    {
        assert(a is Vector and b is Vector, "wrong argument type")
        return a.x == b.x and a.y == b.y
    }

    operator [] (index)
    {
        return (index % 2) == 0 ? self.x : self.y
    }

    operator []= (index, value)
    {
        return index == 0 ? self.x = value : self.y = value
    }

    function tostring()
    {
        return "(${self.x}, ${self.y})"
    }
}
```

With `[]` and `[]=` both defined, all of the following work as expected:

```tea
var v = Vector.new(1, 2)
print(v[0])     // 1
v[0] = 5        // calls []=
v[0] += 12      // calls [], then +, then []=; v.x is now 17
```

The following operators are available for overloading:

operator | description
---|---
`+` `-` `*` `/` `%` `**` | Arithmetic (and unary `-`)
`==` `<` `>` `<=` `>=` | Comparison (`!=` follows from `==`)
`&` `\|` `^` `~` `<<` `>>` | Bitwise
`[]` `[]=` | Subscript read and write
`()` | Call

## Inheritance

A class can inherit from another using the `:` syntax:

```tea
class Animal
{
    new(name)
    {
        self.name = name
    }

    function speak()
    {
        print(self.name .. " makes a sound")
    }
}

class Dog : Animal
{
    new(name)
    {
        super(name)
    }

    function speak()
    {
        print(self.name .. " barks")
    }
}

var d = Dog.new("Rex")
d.speak()   // Rex barks
```

Teascript supports single inheritance only. A subclass inherits all methods of its parent and can override any of them by declaring a method with the same name.

`super` refers to the parent class. Calling `super(args)` in the constructor is shorthand for `super.new(args)`, delegating initialization to the parent. It should generally appear first in the subclass constructor, so that any fields the parent sets up are in place before the subclass adds its own. Outside the constructor, `super.name` accesses a method from the parent class directly, bypassing the current class's override:

```tea
class Cat : Animal
{
    function speak()
    {
        super.speak()
        print("...but also purrs")
    }
}

var c = Cat.new("Miso")
c.speak()
// Miso makes a sound
// ...but also purrs
```

Inheritance works well when there is a genuine _is-a_ relationship between types, and when the subclass truly extends the parent's behavior rather than replacing most of it. A `Dog` that is also an `Animal` is a natural fit. A class that overrides every method it inherits is a sign that inheritance was the wrong tool — composition, where one object holds a reference to another and delegates selectively, is often cleaner.

Static methods are also inherited and accessible on subclasses, though each class maintains its own namespace for static members and does not share them with the parent.
