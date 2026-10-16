---
title: Object System
number: "8."
weight: 800
---

A _class_ defines the behaviour shared by its instances. Methods, static methods, accessors and operator methods. An _instance_ is an object that belongs to one class and has its own attributes, which are created by assignment and not declared.

This chapter defines class declarations and instantiation, how a name on an object is resolved to a method or an attribute, the special methods through which a class customizes the language's operators and constructs, inheritance, and the identity and equality of objects. The representation of classes and instances is described in [Type System](type-system.md#class-and-instance), the member access and `super` expressions in [Expressions](expressions.md), and function parameters and closures in [Functions](functions.md).

## Class Definition and Instantiation

### Class Declarations

```
class_declaration ::= 'class' <name> ( ':' expression )? '{' member* '}'
 
member            ::= constructor | method | static_method
                    | operator_method | getter | setter
 
constructor       ::= 'new' '(' parameters? ')' block
method            ::= 'function' <name> '(' parameters? ')' block
static_method     ::= 'static' <name> '(' parameters? ')' block
operator_method   ::= 'operator' operator_symbol '(' parameters? ')' block
operator_symbol   ::= '+' | '-' | '*' | '/' | '%' | '**'
                    | '&' | '|' | '~' | '^' | '<<' | '>>'
                    | '<' | '<=' | '>' | '>=' | '=='
                    | '[' ']' | '[' ']' '='
getter            ::= <name> block
setter            ::= <name> '=' '(' parameters? ')' block
```

Evaluating a class declaration:

1. Creates a new class object with the given name and **declares the variable** `Name` for it, so the name is visible in the superclass expression and in every member. The variable is an ordinary mutable variable of the enclosing scope; see [Declarations](declarations.md)
2. If a superclass is given `class Name : expression`, evaluates the expression and makes the new class inherit the result; see [Inheritance Semantics](#inheritance-semantics). Otherwise the class inherits from the **root class** `Object`, the class at the top of every inheritance chain
3. Evaluates the members **in source order**, creating a function for each one and storing it in the class under its name. A member whose name is already present in the class, whether declared earlier in the same body or inherited, **replaces** the earlier one

A class body contains only members; there are no field declarations. Members are functions. They capture the variables of the scopes that enclose the class declaration exactly as other functions do, and the `parameters` follow the rules of [Functions](functions.md#parameters). Methods can also be added to an existing class with `function Class:name(...) { ... }`.

| Member | Declared as | Receiver `self` | Called as |
| --- | --- | --- | --- |
| Constructor | `new(...)` | the new instance | `Class.new(...)` |
| Method | `function name(...)` | the object | `object.name(...)` |
| Static method | `static name(...)` | none: `self` is a compile-time error | `Class.name(...)` |
| Getter | `name { ... }` | the object | read of `object.name` |
| Setter | `name= (value) { ... }` | the object | assignment of `object.name` |
| Operator method | `operator + (a, b) { ... }` | none, except for `[]` and `[]=` | by the operator |

`self` is a reserved word that denotes the receiver; it can be used only in the members for which the table shows a receiver, and elsewhere it is a compile-time error; see [Expressions](expressions.md#self-and-super).

### Instantiation

`Class.new(arguments)` creates an instance of `Class`:

1. `Class` must be a class, otherwise a runtime error is raised
2. The class must have a **constructor**, that is a member named `new`, declared in the class or inherited from a superclass. If it has none, a runtime error is raised, since a class without constructor cannot be instantiated
3. A new instance of `Class`, with no attributes, is created
4. The constructor is called with the new instance as `self` followed by the arguments, under the rules of [Functions](functions.md#calling-convention)
5. The expression evaluates to **the new instance**. A constructor implicitly returns it. The constructor's own `return` may not carry a value; see [return](statements.md#return)

A constructor that is a native function is called with the class as receiver and will need to create the object itself.

The class `Class` is no callable. `Class(arguments)` is a runtime error.

### Attributes

An instance holds a table of **attributes**, which map names to values. Attributes are not declared. They come into existence when they are first assigned, usually in the constructor:

```tea
class Point
{
    new(x, y)
    {
        self.x = x          // creates the attributes x and y
        self.y = y
    }
 
    function len()
    {
        return (self.x ** 2 + self.y ** 2) ** 0.5
    }
}
 
var p = Point.new(3, 4)
p.len()     // -> 5
p.z = 0     // attributes can be added to any instance at any time
```

Attributes belong to the instance and are not shared with other instances or inherited. An attribute that holds a function is called like a method, `p.callback(args)`, but is not given a receiver.

## Method Resolution Order

For a method call `object.name(args)` on an instance (or userdata), `name` is resolved by trying the following in order and using the first that applies:

| Step | Looks for | Result |
| :---: | --- | --- |
| 1 | an **attribute** `name` of the object | its value is called as a function; no receiver is passed |
| 2 | a **member** `name` in the **class** of the object | an ordinary method is called with the object as `self`; a **getter** is called without arguments, and the value it returns is what is then called with `args` |
| 3 | the class's special method `getattr` | it is called with the name as argument, and the value it returns is what is then called with `args` |
| 4 | nothing found | a runtime error |

Attributes are therefore searched **before** methods. An attribute hides a method of the same name.

The lookup of the class (step 2) consults **a single table**, the method table of the object's class. There is no walk up of a chain of superclasses at runtime, because inheritance is implemented by _copying_ the superclass's members into the subclass when the subclass is declared (see below). Consequently, within one class the order of precedence for a name is: the members of the class itself, declared later replacing earlier ones, then the members inherited from the superclass, which were copied before the class's own members were created.

The same lookup applies to the other kinds of receiver:

| Receiver | Resolution of `value.name(args)` |
| --- | --- |
| a class | only its `static` members; otherwise a runtime error |
| an instance, userdata | steps 1 to 4 above |
| a module | the exported value `name`; see [Module](type-system.md#module) |
| a value of a built-in type | the member `name` of the built-in class of its type (if it is a getter, it is called first, as in step 2) |

A `super.name` expression looks `name` up in the method table of the superclass (see below), not in the class of `self`.

## Special Methods

A class customizes the behaviour of operators and certain constructs by defining **special methods**. They are found by name in the class's method table, exactly like other members, so they are inherited and can be overridden. The names are fixed:

| Name | Declared as | Used by |
| --- | --- | --- |
| `new` | `new (...)` | instantiation |
| `+` `-` `*` `/` `%` `**` `&` `\|` `~` `^` `<<` `>>` `<` `<=` `>` `>=` `==` | `operator ...` | the corresponding operators |
| `[]`, `[]=` | `operator [] (...)`, `operator []= (...)` | reading and writing with `object[index]` |
| `getattr` | `function getattr(name) { ... }` | attribute lookup that finds nothing |
| `setattr` | `function setattr(...) { ... }` | assignment to attributes |
| `call` | `function call(...) { ... }` | calling an instance |
| `iter` | `function iter() { ... }` | `for in` loops |
| `contains` | `function contains(value) { ... }` | `in` and `not in` |
| `tostring` | `function tostring() { ... }` | conversion to string by the standard library |
| `gc` | `function gc() { ... }` | finalization |

### get / set

A **getter** is a member written as a name followed by a block, with no parameters. A **setter** is a name, `=`, a parameter list and a block. They make reading and assigning an attribute run code:

```tea
class Temperature
{
    new(celsius) { self.c = celsius }

    fahrenheit
    {                         // getter: t.fahrenheit
        return self.c * 9 / 5 + 32
    }

    kelvin = (value)    // setter: t.kelvin = 300
    {
        self.c = value - 273.15
    }
}
```

A getter is called with the object as `self` and no arguments when `object.name` is read; the value it returns is the value of the expression. A setter is called with the object as `self` and the assigned value as its argument when `object.name` is assigned. When a getter is the target of a method call, `object.name(args)`, the value it returns is called with `args` (step 2 above).

### getattr / setattr

`getattr` is the fallback attribute lookup on an instance. It is called with the object as `self` and the name of the attribute as a string argument, when the object has no attribute and its class has no member of that name. Its result is the value of the attribute, and in a method call it is then called with the arguments. It allows for computed or proxied attributes:

```tea
class Proxy {
    new(target) { self.target = target }

    function getattr(name)
    {
        return self.target[name]
    }
}
```

`setattr` is the corresponding hook for assignments to attributes. It is the class's own handler for `object.name = value` and is called with the object as `self`.

### call

If the class of an instance defines `call`, the instance is **callable**. `object(args)` calls `call` with the object as `self` and the arguments. An instance whose class has no `call` method is not callable. Calling it is a runtime error.

```tea
class Adder
{
    new(n) { self.n = n }
    function call(x) { return x + self.n }
}
 
var add5 = Adder.new(5)
add5(10)                  // -> 15
```

### Operator Overload Dispatch Table

An operator is overloaded by an `operator` member of the class. The rule that decides _which_ method is used (the left operand's class first, then the right operand's; no method is a runtime error) and the way its result is used are described in [Operator Overloading Dispatch](expressions.md#operator-overloading-dispatch). The table gives, for each overloadable operator, the special method that implements it and how it is called.

| Operator | Declaration | Arguments | Notes |
|----------|-------------|-----------|-------|
| `a + b` `a - b` `a * b` `a / b` `a % b` `a ** b` | `operator + (a, b)` | `a`, `b` | |
| `a & b` `a \| b` `a ^ b` `a << b` `a >> b` | `operator & (a, b)` | `a`, `b` | |
| `a < b` `a <= b` `a > b` `a >= b` | `operator < (a, b)` | `a`, `b` | each is separate; none is derived from another |
| `a == b` | `operator == (a, b)` | `a`, `b` | only if an operand is an instance or userdata |
| `-a` | `operator - (a, b)` | `a`, `nil` | the same method as binary `-`; `b` is `nil` for the unary operator |
| `~a` | `operator ~ (a, b)` | `a`, `nil` | the same method as binary `~` |
| `a[i]` | `operator [] (i)` | `i` | `self` is the receiver |
| `a[i] = v` | `operator []= (i, v)` | `i`, `v` | `self` is the receiver |
| `x in a` | `function contains(x)` | `x` | a method of the right operand |

The conventions of operator methods:

- A method for a **binary or unary operator** is a function with **two explicit parameters** and **no `self`**. It receives both operands, in source order, whichever of the two operands' classes supplied it. Declaring a different number of parameters makes every use of the operator fail with an argument-count runtime error.
- `!=` is the logical negation of the result of `==` and `not in` of `in`; neither can be defined. `and`, `or`, `not`, `!`, `is`, `is not`, `..` and the conditional operator `?` cannot be overloaded.
- The value returned by an operator method **is** the value of the expression, with no conversion. A `<` method may return a number or an object, and an `==` method's result is converted to a boolean only by `!=`.
- `operator` can only declare the operators in the table; any other symbol is a compile-time error.

```tea
class Vec
{
    new(x, y) { self.x = x; self.y = y }

    operator + (a, b) { return Vec.new(a.x + b.x, a.y + b.y) }
    operator == (a, b) { return a.x == b.x and a.y == b.y }
    operator - (a, b)
    {
        if not (b is Vec) { return Vec.new(-a.x, -a.y) }   // unary minus: b is nil
        return Vec.new(a.x - b.x, a.y - b.y)
    }
}
```

The special methods `iter` (see [Iterative for](statements.md#iterative-for)), `contains`, `tostring` and `gc` are ordinary methods called with `self`, in the situations described in the table of special methods above.

## Inheritance Semantics

A class inherits from at most one superclass, named after `:` in its declaration. The expression after `:` is evaluated once, when the class declaration is executed.

#### Requirements
The value must be a class, otherwise a runtime error is raised. It must not be a built-in class (the classes of numbers, booleans, functions, strings, lists, maps and ranges), and a class cannot inherit from itself.

#### What is Inherited
When the declaration is executed, the new class takes from its superclass:

- the **constructor**, which a class that declares no `new` of its own uses its constructor;
- a **copy of the superclass's member table**: methods, static methods, accessors and operator methods, including those the superclass itself inherited

The copy is made **before** the members of the new class are created, so a member declared in the class replaces the inherited member with the same name. This is how are overridden. Inheritance is a **snapshot**; members added to or replaced in the superclass _after_ the subsclass was declared (for example with `function Super:name()`) are not seen by the subclass.

Attributes are not inherited, since they belong to instances. The constructor of a subclass is responsible for intializing the attributes that the superclass's constructor creates, usually by calling it with `super(args)`.

#### super
Inside a class declared with a superclass, `super` refers to the superclass **given in that declaration**, fixed when the class is declared. It is not the superclass of the object's actual class, so in a class `B` with superclass `A`, `super.m()` calls `A`'s `m` even when `self` is an instance of a subclass of `B`:

| Form | Meaning |
| --- | --- |
| `super.name(args)` | calls `name` from the superclass's member table, with the current `self` as receiver |
| `super(args)` | calls the superclass's `new` with the current `self`: it initializes the object, and does not create one |
| `super.name` | a bound method, pairing that member with `self` |

If the superclass has no member called `name`, a runtime error is raised.

```tea
class Animal
{
    new(name) { self.name = name }
    function describe() { return self.name }
}

class Dog : Animal
{
    new(name)   // runs Animal's constructor on this object
    {
        super(name)
        self.tricks = []
    }
    function describe() // overrides Animal's describe
    {
        return super.describe() + " the dog"
    }
}
```

#### The Class Relation
The expression `value is Class` is true when the class of `value` is `Class` or when `Class` can be reached from it by following superclass links; every class reaches the root class. See [Identity](expressions.md#identity).

## Identity and Equality

#### Identity
Every instance created by `Class.new` is a distinct object. Classes, functions, bound methods and modules are also single objects. Assigning or passing such a value copies the _reference_; the object remains the same one.

#### Equality
The `==` operator applies the equality relation defined in [Type System](type-system.md#equality), which for objects is as follows:

- Two instances are equal exactly when they are **the same object**, unless the class of one of them defines an `==` operator method. In that case the method is called with both operands (the left operand's class first, then the right operand's) and its result is the value of the expression, with no conversions to boolean
- Two classes are equal only if they are the same class, and two modules only if they are the same module
- A function is equal only to itself; each evaluation of a function expression creates a new function
- An `==` method is consulted only when at least one operand is an instance or a userdata; comparisons between values of any other types never call a method

An `==` method overrides the language's comparison for that class only. It does not affect `switch`/`case`, which always compares by the built-in relation, and a user `==` that is inconsistent (for instance not symmetric) is not detected.

```tea
var a = Vec.new(1, 2)
var b = Vec.new(1, 2)
a == b                    // true, if Vec defines == as above; false otherwise
a is Vec                  // true
```
