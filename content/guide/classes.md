---
title: Classes
weight: 180
toc: true
---

Classes provide a means to gather functions and data together to provide a blueprint for objects.

Classes define an objects behavior and state. Behavior is defined by methods which live in the class. Every object of the same class supports the same methods. State is defined in fields, whose values are stored in each instance.

# Defining a class

Classes are created using the `class` keyword:

```tea
class Mocha { }
```

This creates a class named `Mocha` with no methods or attributes.

# Methods

To let our mocha do stuff, we need to give it methods:

```tea
class Mocha
{
    brew()
    {
        print("Brewing a rich and delightful mocha, just for you!")
    }
}
```

This defines a `brew` method that takes no arguments. To add parameters, put their names inside the parentheses:

```tea
class Mocha
{
    brew(size, flavor)
    {
        print("Brewing a ${size} ${flavor} mocha!")
    }
}
```

## Constructors

We've seen how to define kinds of objects and define methods on them.
Our mochas can brew any kind of coffee beans, but we don't actually *have* any mochas to do it. To create *instances* of a class, we need a *constructor*. You define one like so:

```tea
class Mocha
{
    init(size, flavor)
    {
        print("Creating a ${size} ${flavor} mocha!")
    }
}
```

The `init` name says we're defining a constructor.

To make a new mocha now, we just call the class itself:

```tea
var myMocha = Mocha("large", "vanilla")
```

A constructor returns the instance of the class being created, even if you don't explicitly use `return`. It is valid to use `return` inside of a constructor, but it is an error to have an expression after the return. That rule applies to return `this` as well, `return` handles that implicitly inside a constructor, so just `return` is enough.

```tea
return          // valid, returns 'this'

return variable // invalid
return nil     // invalid
return this     // also invalid
```

# Inheritance

A class can inherit from a "parent" or superclass. When you invoke a method on an object of some class, if it can't be found, it walks up the chain of superclasses looking for it there.

By default, any new class inherits from `Object`, which is the superclass from which all other classes ultimately descend. You can specify a different parent class using `:` when you declare the class:

```tea
class IcedMocha is Mocha {}
```

This declares a new class Iced Mocha that inherits from Mocha.