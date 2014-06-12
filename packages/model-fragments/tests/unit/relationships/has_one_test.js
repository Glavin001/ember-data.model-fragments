var store, Transaction, Purchase, Product, products, transactions;
var all = Ember.RSVP.all;

module("unit/relationships - DS.belongsTo", {
  setup: function() {

    // Models
    Transaction = DS.Model.extend({
      purchases: DS.hasManyFragments('purchase')
    });
    Purchase = DS.ModelFragment.extend({
      quantity: DS.attr('number'),
      product: DS.belongsTo('product', {async: true})
    });
    Product = DS.Model.extend({
      name: DS.attr('string'),
      price: DS.attr('number')
    });

    // Initialize Store
    env = setupStore({
      transaction: Transaction,
      purchase: Purchase,
      product: Product
    });
    store = env.store;

    // Fixtures
    products = [
      {
        id: 1,
        name: "Milk",
        price: 6.00
      },
      {
        id: 2,
        name: "Cheese",
        price: 0.50
      }
    ];

    transactions = [
      {
        id: 1,
        purchases: [
          {
            quantity: 1,
            product: 1
          },
          {
            quantity: 1,
            product: 2
          }
        ]
      },
      {
        id: 2,
        purchases: [
          {
            cost: 1,
            quantity: 1,
            product: 2
          }
        ]
      },
      {
        id: 3,
        purchases: null
      }
    ];
  },

  teardown: function() {
    store = null;
    Transaction = null;
    Purchase = null;
    Product = null;
    products = null;
    transactions = null;
  }
});

function pushTransaction(id) {
  store.push(Transaction, Ember.copy(Ember.A(transactions).findBy('id', id), true));
}

function pushProduct(id) {
  store.push(Product, Ember.copy(Ember.A(products).findBy('id', id), true));
}

test("properties are instances of `DS.FragmentArray`", function() {
  pushTransaction(1);

  store.find(Transaction, 1).then(async(function(transaction) {
    var purchases = transaction.get('purchases');

    ok(Ember.isArray(purchases), "property is array-like");
    ok(purchases instanceof DS.FragmentArray, "property is an instance of `DS.FragmentArray`");
  }));
});

test("arrays of object literals are deserialized into instances of `DS.ModelFragment`", function() {
  pushTransaction(1);

  store.find(Transaction, 1).then(async(function(transaction) {
    var purchases = transaction.get('purchases');

    ok(purchases.every(function(purchase) {
      return purchase instanceof Purchase;
    }), "each fragment is a `DS.ModelFragment` instance");
  }));
});


test("fragments created through the store can be added to the fragment array", function() {
  pushTransaction(1);

  store.find(Transaction, 1).then(async(function(transaction) {
    var purchases = transaction.get('purchases');
    var length = purchases.get('length');

    var purchase = store.createFragment('purchase', {
        quantity: 1,
        product: null
    });

    purchases.addFragment(purchase);

    equal(purchases.get('length'), length + 1, "purchases property size is correct");
    equal(purchases.indexOf(purchase), length, "new fragment is in correct location");
  }));
});


test("fragments created with belongsTo relationship to a model can be added to the fragment array", function() {
  pushTransaction(1);
  pushProduct(1);

  store.find(Transaction, 1).then(async(function(transaction) {
    var purchases = transaction.get('purchases');
    var length = purchases.get('length');
    store.find(Product, 1).then(async(function(product) {
        ok(product instanceof Product, "product record is an instance of `Product`");

        var purchase = store.createFragment('purchase', {
            quantity: 1,
            product: product
        });

        console.log('purchase', purchase);

        // equal(purchase.get('product'), product, "property of belongsTo is correct model record");

  //       purchases.addFragment(purchase);
  //
  //       equal(purchases.get('length'), length + 1, "purchases property size is correct");
  //       equal(purchases.indexOf(purchase), length, "new fragment is in correct location");

    }));
  }));

});


// test("fragments pushed with belongsTo relationship to a model", function() {
//   pushProduct(1);
//   pushTransaction(1);
//
//   store.find(Transaction, 1).then(async(function(transaction) {
//     var purchases = transaction.get('purchases');
//     var length = purchases.get('length');
//
//     store.find(Product, 1).then(async(function(product) {
//         ok(product instanceof Product, "product record is an instance of `Product`");
//
//         var purchase = purchases.objectAt(0);
//         ok(purchase instanceof Purchase, "purchase record is an instance of `Purchase`");
//
//         var p = purchase.get('product');
//         ok(typeof p !== "number", "purchase's product attribute is not a number (id)");
//         ok(p instanceof Product, "purchase's product attribute is an instance of `Product`");
//
//         //equal(purchase.get('product'), product, "property of belongsTo is correct model record");
//
//         //equal(purchases.get('length'), length + 1, "purchases property size is correct");
//         //equal(purchases.indexOf(purchase), length, "new fragment is in correct location");
//
//     }));
//   }));
// });
//
// test("serializing creates a new Array with contents the result of serializing each fragment", function() {
//
//   pushProduct(1);
//   pushProduct(2);
//   pushTransaction(1);
//
//   env.container.register('serializer:purchase', DS.JSONSerializer);
//
//   // TODO: this is necessary to set `typeKey` and prevent `store#serializerFor` from blowing up
//   store.modelFor('transaction');
//
//   store.find(Transaction, 1).then(async(function(transaction) {
//     var serialized = transaction.serialize();
//
//     var s = Ember.copy(Ember.A(transactions).findBy('id', 1));
//     delete s.id; // Remove ID because serialize does not include ID
//
//     deepEqual(serialized, s, "serializing returns array of each fragment serialized including belongsTo relationships");
//   }));
// });
//
//
// test("serializing model with fragments and sub-model relationship", function() {
//
//   env.container.register('serializer:purchase', DS.JSONSerializer);
//   // TODO: this is necessary to set `typeKey` and prevent `store#serializerFor` from blowing up
//   store.modelFor('transaction');
//
//   var transaction = store.createRecord('transaction', {
//       purchases: []
//   });
//
//   var product = store.createRecord('product', {
//     id: 1,
//     name: "Milk",
//     price: 6.00
//   });
//
//   var purchase = store.createFragment('purchase', {
//       quantity: 1,
//       product: product
//   });
//
//   var length = transaction.get('purchases').get('length');
//
//   var purchases = transaction.get('purchases');
//   purchases.addFragment(purchase);
//
//   equal(purchases.get('length'), length + 1, "purchases property size is correct");
//   equal(purchases.indexOf(purchase), length, "new fragment is in correct location");
//
//   var serialized = transaction.serialize();
//
//   deepEqual(serialized, {
//     purchases: [
//       {
//         quantity: 1,
//         product: "1" // Record should be returned as an ID, IDs are strings.
//       }
//     ]
//   }, "serializing returns array of each fragment serialized including belongsTo relationships");
//
// });
