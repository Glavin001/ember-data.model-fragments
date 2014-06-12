import Ember from 'ember';
import Model from './model';

/**
  @module ember-data.model-fragments
*/
var get = Ember.get;

// Ember object prototypes are lazy-loaded
Model.proto();

// TODO: is it easier to extend from DS.Model and disable functionality than to
// cherry-pick common functionality?
var protoProps = [
  '_setup',
  '_unhandledEvent',
  'send',
  'transitionTo',
  'data',
  'isEmpty',
  'isLoading',
  'isLoaded',
  'isDirty',
  'isSaving',
  'isDeleted',
  'isNew',
  'isValid',
  'serialize',
  'changedAttributes',
  'eachAttribute',
  'fragmentDidDirty',
  'fragmentDidReset',
  'rollbackFragments',

  'didDefineProperty',
  'typeForRelationship',
  'relationships',
  'relationshipNames',
  'relatedTypes',
  'relationshipsByName',
  'fields',
  'eachRelationship',
  'eachRelatedType'

].reduce(function(props, name) {
  props[name] = Model.prototype[name] || Ember.meta(Model.prototype).descs[name];
  return props;
}, {});

var classProps = [
  'attributes',
  'eachAttribute',
  'transformedAttributes',
  'eachTransformedAttribute',

 // https://github.com/emberjs/data/blob/master/packages/ember-data/lib/system/relationships/ext.js
  // 'didDefineProperty',
  // 'typeForRelationship',
  // 'relationships',
  // 'relationshipNames',
  // 'relatedTypes',
  // 'relationshipsByName',
  // 'fields',
  // 'eachRelationship',
  // 'eachRelatedType'

].reduce(function(props, name) {
  props[name] = Model[name] || Ember.meta(Model).descs[name];
  return props;
}, {});

/**
  CoreModel is a base model class that has state management, but no relation or
  persistence logic.

  @class CoreModel
*/
var CoreModel = Ember.Object.extend(Ember.CoreObject.PrototypeMixin, Ember.CoreObject.ClassMixin, Ember.Evented, protoProps, {
  // eachRelationship: Ember.K,
  updateRecordArraysLater: Ember.K
});

CoreModel.reopenClass(classProps, {

  /**
    Given a callback, iterates over each of the relationships in the model,
    invoking the callback with the name of each relationship and its relationship
    descriptor.

    @method eachRelationship
    @static
    @param {Function} callback the callback to invoke
    @param {any} binding the value to which the callback's `this` should be bound
  */
  // eachRelationship: function(callback, binding) {
  //   console.log('eachRelationship', callback, binding);
  //   //binding = binding || this;
  //
  //   get(this, 'relationshipsByName').forEach(function(name, relationship) {
  //     console.log('name rel:', name, relationship);
  //     callback.call(binding, name, relationship);
  //   });
  // },

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
//   relationshipsByName: Ember.computed(function() {
//     console.log('relationshipsByName');
//
//     var map = Ember.Map.create(), type;
//
//     this.eachComputedProperty(function(name, meta) {
//       if (meta.isRelationship) {
//         meta.key = name;
//         type = meta.type;
//
//         if (!type && meta.kind === 'hasMany') {
//           type = singularize(name);
//         } else if (!type) {
//           type = name;
//         }
//
//         if (typeof type === 'string') {
//           meta.type = this.store.modelFor(type);
//         }
//
//         map.set(name, meta);
//       }
//     });
//
//     return map;
// })

});

export default CoreModel;
