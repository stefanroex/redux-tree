# Redux Tree (WIP)
[![Build Status](https://travis-ci.org/stefanroex/redux-tree.svg)](https://travis-ci.org/stefanroex/redux-tree)

Denormalize your immutable Redux store for easy consumption by the views.

* Define your relations in the Redux store.
* Denormalize the relations with a single function.
* Keeps track of the previous state and only updates what is nessecary.
* Works with `PureRenderMixin`.
* Requires Immutable.js.

## Why

We save our Redux app state in a normalized way and when a React component wants to consume the state, we'll denormalize it with some helper function, maybe even with the help of [reselect](https://github.com/rackt/reselect). This is extremely powerfull when the transformations are advanced, but most of the time you're just combining several parts of the state into a single entity.

This library enables you to define the relations directly in the reducers. You can denormalize the app state with a single function.

## Installation

    Not yet published on npm...

## Example

```javascript
import { Map } from 'immutable';
import { createTree, Ref } from 'redux-tree';

// Define a relation in your appState via Ref.
const state = Map({
  posts: Map({
    id1: Map({
      id: 'id1',
      name: 'post1',
      user: Ref('users', 'id1');
    })
  }),
  users: Map({
    id1: Map({
      id: 'id1',
      name: 'user1'
    })
  })
});

// Create the tree transformer function.
stateToTree = createTree();

// Give the transformer your state and it will automatically join the relations
const result = stateToTree(state);
// result.getIn(['posts', 'id1', 'user']) #=> Map({id: 'id1', name: 'user1'})
```

## Caveats

* Sets are converted to Maps.

## Todo

* Code cleanup
* Extra ref-types
* Test if it works when state is removed
* Remove Immutable.js rependency in library code (still requires the an immutable state)
* Find a way to convert Sets back to Sets

## License

The MIT License (MIT)
