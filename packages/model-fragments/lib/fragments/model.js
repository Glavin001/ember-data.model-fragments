import Ember from 'ember';
import CoreModel from '../core-model';
import FragmentRootState from './states';

/**
  @module ember-data.model-fragments
*/

var get = Ember.get;

/**
  The class that all nested object structures, or 'fragments', descend from.
  Fragments are bound to a single 'owner' record (an instance of `DS.Model`)
  and cannot change owners once set. They behave like models, but they have
  no `save` method since their persistence is managed entirely through their
  owner. Because of this, a fragment's state directly influences its owner's
  state, e.g. when a record's fragment `isDirty`, its owner `isDirty`.

  Example:

  ```javascript
  App.Person = DS.Model.extend({
    name: DS.hasOneFragment('name')
  });

  App.Name = DS.ModelFragment.extend({
    first  : DS.attr('string'),
    last   : DS.attr('string')
  });
  ```

  With JSON response:

  ```json
  {
    "id": "1",
    "name": {
      "first": "Robert",
      "last": "Jackson"
    }
  }
  ```

  ```javascript
  var person = store.getbyid('person', '1');
  var name = person.get('name');

  person.get('isDirty'); // false
  name.get('isDirty'); // false
  name.get('first'); // 'Robert'

  name.set('first', 'The Animal');
  name.get('isDirty'); // true
  person.get('isDirty'); // true

  person.rollback();
  name.get('first'); // 'Robert'
  person.get('isDirty'); // false
  person.get('isDirty'); // false
  ```

  @class ModelFragment
  @namespace DS
  @extends CoreModel
  @uses Ember.Comparable
  @uses Ember.Copyable
*/
var ModelFragment = CoreModel.extend(Ember.Comparable, Ember.Copyable, {
  /**
    The fragment's property name on the owner record.

    @property _name
    @private
    @type {String}
  */
  _name: null,

  /**
    A reference to the fragment's owner record.

    @property _owner
    @private
    @type {DS.Model}
  */
  _owner: null,

  /**
    A reference to a state object descriptor indicating fragment's current state.

    @property currentState
    @private
    @type {Object}
  */
  currentState: FragmentRootState.empty,

  /**
    @method setupData
    @private
    @param {Object} data
  */
  setupData: function(data) {
    console.log('ModelFragment - setupData', arguments);


    var store = get(this, 'store');
    var key = get(this, 'name');
    var type = store.modelFor(this.constructor);
    var serializer = store.serializerFor(type);

    // Setting data means the record is now clean
    this._attributes = {};

    // TODO: do normalization in the transform, not on the fly
    this._data = serializer.normalize(type, data, key);
    console.log(key, type, serializer);
    console.log(this._data, data);

    console.log('CoreModel', this.eachRelationship);

    // Normalize Relationships
    console.log('_proto', this._proto);
    console.log('relationshipsByName', this.relationshipsByName);


    // Initiate state change
    this.send('pushedData');

    // Notify attribute properties/observers of internal change to `_data`
    this.notifyPropertyChange('data');
  },

  /**
    Given a callback, iterates over each of the relationships in the model,
    invoking the callback with the name of each relationship and its relationship
    descriptor.

    @method eachRelationship
    @param {Function} callback the callback to invoke
    @param {any} binding the value to which the callback's `this` should be bound
  */
  // eachRelationship: function(callback, binding) {
  //   this.constructor.eachRelationship(callback, binding);
  // },

  /**
    Like `DS.Model#rollback`, if the fragment `isDirty` this function will
    discard any unsaved changes, recursively doing the same for all fragment
    properties.

    Example

    ```javascript
    fragment.get('type'); // 'Human'
    fragment.set('type', 'Hamster');
    fragment.get('type'); // 'Hamster'
    fragment.rollback();
    fragment.get('type'); // 'Human'
    ```

    @method rollback
  */
  rollback: function() {
    this._attributes = {};

    // Rollback fragments from the bottom up
    this.rollbackFragments();

    // Initiate state change
    this.send('rolledBack');

    // Notify attribute properties/observers of internal change to `_data`
    this.notifyPropertyChange('data');
  },

  /**
    Compare two fragments by identity to allow `FragmentArray` to diff arrays.

    @method compare
    @param a {DS.ModelFragment} the first fragment to compare
    @param b {DS.ModelFragment} the second fragment to compare
    @return {Integer} the result of the comparison
  */
  compare: function(f1, f2) {
    return f1 === f2 ? 0 : 1;
  },

  /**
    Create a new fragment that is a copy of the current fragment. Copied
    fragments do not have the same owner record set, so they may be added
    to other records safely.

    @method copy
    @return {DS.ModelFragment} the newly created fragment
  */
  copy: function() {
    var store = get(this, 'store');
    var type = store.modelFor(this.constructor);
    var data = {};

    // TODO: handle copying sub-fragments
    Ember.merge(data, this._data);
    Ember.merge(data, this._attributes);

    return this.store.createFragment(type, data);
  },

  /**
    @method adapterDidCommit
  */
  adapterDidCommit: function() {
    // Merge in-flight attributes if any
    if (Ember.keys(this._inFlightAttributes).length) {
      Ember.mixin(this._data, this._inFlightAttributes);
      this._inFlightAttributes = {};
    }

    var fragment;

    // Notify fragments that the owner record was committed
    for (var key in this._fragments) {
      fragment = this._fragments[key];
      fragment && fragment.adapterDidCommit();
    }

    // Transition directly to a clean state
    this.transitionTo('saved');
  },

  toStringExtension: function() {
    return 'owner(' + get(this, '_owner.id') + ')';
  },

  init: function() {
    this._super();
    this._setup();
  },


    /**
      A map whose keys are the relationships of a model and whose values are
      relationship descriptors.

      For example, given a model with this
      definition:

      ```javascript
      App.Blog = DS.Model.extend({
        users: DS.hasMany('user'),
        owner: DS.belongsTo('user'),

        posts: DS.hasMany('post')
      });
      ```

      This property would contain the following:

      ```javascript
      var relationshipsByName = Ember.get(App.Blog, 'relationshipsByName');
      relationshipsByName.get('users');
      //=> { key: 'users', kind: 'hasMany', type: App.User }
      relationshipsByName.get('owner');
      //=> { key: 'owner', kind: 'belongsTo', type: App.User }
      ```

      @property relationshipsByName
      @static
      @type Ember.Map
      @readOnly
    */
    // relationshipsByName: Ember.computed(function() {
    //   console.log('relationshipsByName');
    //
    //   var map = Ember.Map.create(), type;
    //   console.log(this.eachComputedProperty);
    //
    //   this.eachComputedProperty(function(name, meta) {
    //       console.log('eachComputedProperty', name, meta);
    //
    //     if (meta.isRelationship) {
    //       meta.key = name;
    //       type = meta.type;
    //
    //       if (!type && meta.kind === 'hasMany') {
    //         type = singularize(name);
    //       } else if (!type) {
    //         type = name;
    //       }
    //
    //       if (typeof type === 'string') {
    //         meta.type = this.store.modelFor(type);
    //       }
    //
    //       map.set(name, meta);
    //     }
    //   });
    //
    //   return map;
    // })

});

export default ModelFragment;
