import { expect } from 'chai';
import { Map, List, Set } from 'immutable';

const state = Map({
  posts: Map({
    1: Map({
      id: 1,
      name: 'post1',
      user: ['users', '1']
    }),
    2: Map({
      id: 2,
      name: 'post2',
      user: ['users', '2']
    }),
    3: Map({
      id: 3,
      name: 'post3'
    })
  }),
  users: Map({
    1: Map({
      id: 1,
      name: 'jan',
      comment: ['comments', '1']
    }),
    2: Map({
      id: 2,
      name: 'piet',
      comments: List.of(
        ['comments', '1'],
        ['comments', '2']
      )
    }),
    3: Map({
      id: 2,
      name: 'piet',
      comments: Set.of(
        ['comments', '1'],
        ['comments', '2']
      )
    })
  }),
  comments: Map({
    1: Map({
      id: 1,
      name: 'comment1'
    }),
    2: Map({
      id: 2,
      name: 'comment2'
    })
  })
});

function memoize(func) {
  let lastData = Map();
  let lastResult = null;
  let refs = {};
  return data => {
    lastResult = func(data, lastData, lastResult, refs);
    lastData = data;
    return lastResult;
  };
}

const appToTreeRaw = (state, lastState, lastResult, refs) => {
  const vistedPaths = [];

  const joinRefs = (data, path = [], force = false) => {
    if (!force && state.getIn(path) === lastState.getIn(path)) {
      return lastResult.getIn(path);
    }

    if (lastState.size) {
      vistedPaths.push(path.join('.'));
    }

    if (data instanceof Array) {
      const key = data.join('.');
      if (refs[key]) {
        return refs[key].result;
      }

      const result = joinRefs(state.getIn(data), data, force);
      refs[key] = { key: data, paths: [path], result };
      return result;
    }

    if (typeof data === 'object') {
      return data.map((d, k) => {
        return joinRefs(d, [...path, k], force);
      });
    }

    return data;
  };

  const joinDependencies = (data, key) => {
    const ref = refs[key];
    if (!ref) {
      return;
    }

    ref.result = joinRefs(state.getIn(ref.key), ref.key, true);
    ref.paths.forEach(path => {
      data.setIn(path, ref.result);
      const copyPath = [...path];
      copyPath.pop();
      joinDependencies(data, copyPath.join('.'));
    });
  };

  return joinRefs(state).withMutations(result => {
    vistedPaths.forEach(path => {
      joinDependencies(result, path);
    });
  });
};


describe('Redux Tree', () => {
  let appToTree;
  let result;

  beforeEach(() => {
    appToTree = memoize(appToTreeRaw);
    result = appToTree(state);
  });

  describe('joins', () => {
    it('single references', () => {
      expect(result.getIn(['posts', '1', 'user', 'name'])).to.equal('jan');
      expect(result.getIn(['posts', '2', 'user', 'name'])).to.equal('piet');
      expect(result.getIn(['users', '1', 'comment', 'name'])).to.equal('comment1');
    });

    it('nested references', () => {
      expect(result.getIn(['posts', '1', 'user', 'comment', 'name'])).to.equal('comment1');
    });

    it('List references', () => {
      expect(result.getIn(['users', '2', 'comments', 0, 'name'])).to.equal('comment1');
      expect(result.getIn(['users', '2', 'comments', 1, 'name'])).to.equal('comment2');
    });

    it('Set references', () => {
      const comments = result.getIn(['users', '3', 'comments']);
      const ids = comments.map(comment => comment.get('id'));
      expect(ids).to.equal(Set.of(1, 2));
    });
  });

  describe('Ref checks', () => {
    it('does nothing when nothing has changes', () => {
      const result2 = appToTree(state);
      expect(result === result2).to.equal(true);
    });

    it('keeps the same ref when nothing has changes', () => {
      const updatedState = state.setIn(['posts', '1', 'name'], 'new-name');
      const result2 = appToTree(updatedState);
      expect(result === result2).to.equal(false);
      expect(result.get('comments') === result2.get('comments')).to.equal(true);
      expect(result.get('users') === result2.get('users')).to.equal(true);
      expect(result.getIn(['posts', '2']) === result2.getIn(['posts', '2'])).to.equal(true);
      expect(result.getIn(['posts', '3']) === result2.getIn(['posts', '3'])).to.equal(true);
    });

    it('only updates the part of three where needed', () => {
      const updatedState = state.setIn(['posts', '1', 'name'], 'new-name');
      const result2 = appToTree(updatedState);
      expect(result.getIn(['posts', '1']) === result2.getIn(['posts', '1'])).to.equal(false);
      expect(result2.getIn(['posts', '1', 'name'])).to.equal('new-name');
    });
  });

  describe('Joins after update', () => {
    it('single references', () => {
      const updatedState = state.setIn(['users', '1', 'name'], 'jantje');
      const result2 = appToTree(updatedState);
      expect(result.getIn(['users', '1']) === result2.getIn(['users', '1'])).to.equal(false);
      expect(result2.getIn(['users', '1', 'name'])).to.equal('jantje');
      expect(result2.getIn(['posts', '1', 'user', 'name'])).to.equal('jantje');
    });

    it('nested references', () => {
      const updatedState = state.setIn(['comments', '1', 'name'], 'new-comment');
      const result2 = appToTree(updatedState);
      expect(result.getIn(['comments', '1']) === result2.getIn(['comments', '1'])).to.equal(false);
      expect(result2.getIn(['comments', '1', 'name'])).to.equal('new-comment');
      expect(result2.getIn(['posts', '1', 'user', 'comment', 'name'])).to.equal('new-comment');
    });

    it('List references', () => {
      const updatedState = state.setIn(['comments', '1', 'name'], 'new-comment');
      const result2 = appToTree(updatedState);
      expect(result.getIn(['users', '2', 'comments', 0]) === result2.getIn(['users', 'comments', 0])).to.equal(false);
      expect(result.getIn(['users', '2', 'comments', 1]) === result2.getIn(['users', 'comments', 1])).to.equal(false);
      expect(result2.getIn(['comments', '1', 'name'])).to.equal('new-comment');
      expect(result2.getIn(['users', '2', 'comments', 0, 'name'])).to.equal('new-comment');
    });
  });
});
