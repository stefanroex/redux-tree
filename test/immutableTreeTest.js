import { expect } from 'chai';
import { Map, List, Set } from 'immutable';
import { Ref, createTree } from '../src'

const state = Map({
  posts: Map({
    1: Map({
      id: 1,
      name: 'post1',
      user: Ref('users', '1')
    }),
    2: Map({
      id: 2,
      name: 'post2',
      user: Ref('users', '2')
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
      comment: Ref('comments', '1')
    }),
    2: Map({
      id: 2,
      name: 'piet',
      comments: List.of(
        Ref('comments', '1'),
        Ref('comments', '2')
      )
    }),
    3: Map({
      id: 2,
      name: 'piet',
      comments: Set.of(
        Ref('comments', '1'),
        Ref('comments', '2')
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

describe('Redux Tree', () => {
  let stateToTree;
  let result;

  beforeEach(() => {
    stateToTree = createTree();
    result = stateToTree(state);
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

    xit('Set references', () => {
      const comments = result.getIn(['users', '3', 'comments']);
      const ids = comments.map(comment => comment.get('id'));
      expect(ids).to.equal(Set.of(1, 2));
    });
  });

  describe('Ref checks', () => {
    it('does nothing when nothing has changes', () => {
      const result2 = stateToTree(state);
      expect(result === result2).to.equal(true);
    });

    it('keeps the same ref when nothing has changes', () => {
      const updatedState = state.setIn(['posts', '1', 'name'], 'new-name');
      const result2 = stateToTree(updatedState);
      expect(result === result2).to.equal(false);
      expect(result.get('comments') === result2.get('comments')).to.equal(true);
      expect(result.get('users') === result2.get('users')).to.equal(true);
      expect(result.getIn(['posts', '2']) === result2.getIn(['posts', '2'])).to.equal(true);
      expect(result.getIn(['posts', '3']) === result2.getIn(['posts', '3'])).to.equal(true);
    });

    it('only updates the part of three where needed', () => {
      const updatedState = state.setIn(['posts', '1', 'name'], 'new-name');
      const result2 = stateToTree(updatedState);
      expect(result.getIn(['posts', '1']) === result2.getIn(['posts', '1'])).to.equal(false);
      expect(result2.getIn(['posts', '1', 'name'])).to.equal('new-name');
    });
  });

  describe('Joins after update', () => {
    it('single references', () => {
      const updatedState = state.setIn(['users', '1', 'name'], 'jantje');
      const result2 = stateToTree(updatedState);
      expect(result.getIn(['users', '1']) === result2.getIn(['users', '1'])).to.equal(false);
      expect(result2.getIn(['users', '1', 'name'])).to.equal('jantje');
      expect(result2.getIn(['posts', '1', 'user', 'name'])).to.equal('jantje');
    });

    it('nested references', () => {
      const updatedState = state.setIn(['comments', '1', 'name'], 'new-comment');
      const result2 = stateToTree(updatedState);
      expect(result.getIn(['comments', '1']) === result2.getIn(['comments', '1'])).to.equal(false);
      expect(result2.getIn(['comments', '1', 'name'])).to.equal('new-comment');
      expect(result2.getIn(['posts', '1', 'user', 'comment', 'name'])).to.equal('new-comment');
    });

    it('List references', () => {
      const updatedState = state.setIn(['comments', '1', 'name'], 'new-comment');
      const result2 = stateToTree(updatedState);
      expect(result.getIn(['users', '2', 'comments', 0]) === result2.getIn(['users', 'comments', 0])).to.equal(false);
      expect(result.getIn(['users', '2', 'comments', 1]) === result2.getIn(['users', 'comments', 1])).to.equal(false);
      expect(result2.getIn(['comments', '1', 'name'])).to.equal('new-comment');
      expect(result2.getIn(['users', '2', 'comments', 0, 'name'])).to.equal('new-comment');
    });
  });
});
