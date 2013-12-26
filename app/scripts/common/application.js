//$(document).ready(function () {

window.LazySplit = Ember.Application.create({});


LazySplit.AlertController = Ember.ObjectController.extend({
    msg: null,
    title: null,
    topStyle: "top:40px;",
    heightStyle: 'height:',

    setLayerHeight: function () {
        var layerHeight = $(document).height();
        this.set('heightStyle', "height:" + layerHeight + "px;");
    },
    showAlert: function (title, msg) {

        this.set('msg', msg);
        this.set('title', title);

        this.setLayerHeight();
//        var fromTop = 40 + window.scrollY;
        var fromTop = 70;
        console.log("top" + fromTop);
        this.set('topStyle', "top:" + fromTop + "px;");


    },

    actions: {
        hideAlert: function () {
            this.set('msg', null);
        }
    }

});


Ember.ObjectController.reopen({
    needs: ["alert"]
});

Ember.ArrayController.reopen({
    needs: ["alert"]
});

LazySplit.AppRoute = Ember.Route.extend({
    activate: function () {
        //render common app components

        this.render('alert', { outlet: 'alert',
            into: 'application'});
    }
});

Ember.TextField.reopen({
    attributeBindings: ['min', 'max']
})

LazySplit.NumericTextField = Ember.TextField.extend({

    numeric_regex: /^(([0-9]*)|(([0-9]*).([0-9]*)))$/,
    validateOnInput: true,

    focusOut: function (event) {
        console.log('focusOut');
        console.log(event);

        this.validateValue();
    },

    keyPress: function (event) {
        console.log('keydown');


//        if(this.numeric_regex.test(this.value) && this.validateOnInput && (this.value !== '')) {
//            this.validateValue();
//        }
        if (String.fromCharCode(event.keyCode).match(/[^0-9]/g)) {

            return false;
        }
    },

    validateValue: function () {

        if (!this.numeric_regex.test(this.value)) {
            if (this.validateOnInput) {
//                this._context.showError(this.invalidInputErrorCode);
                console.log("error");
//            this.set('value', '');
            }
        }
    }


});

LazySplit.LazyTextField = LazySplit.NumericTextField.extend({

    getCurrentValue: function () {
        return this.$().val();
    }
});

LazySplit.Merchant = Ember.Object.extend({
    bankBalanceChanged: '0',
    percentageCut: '10'

    //check percentage cut doesn't go more than 100%
});

LazySplit.MerchantController = Ember.ObjectController.extend({
    setMerchantData:false,
    actions: {
        setTrue:function(){
            this.set("setMerchantData", true);
        },

        helpBankBalanceChanged: function () {
            this.get('controllers.alert').showAlert("WHAT'S THIS?", "Before selling any loot, ensure that you deposit all gold on hand, type 'show summary' and key in the amount under 'bank balance changed'. This is the base amount, used to calculate the amount of gold from selling the first batch of loot.");

        },

        helpPercentageCut: function () {
            this.get('controllers.alert').showAlert("WHAT'S THIS?", "This is the percentage cut you will take from the amount of gold from the loot you sell. Generally, merchants take a 10% cut. If you are part of the party you are selling for, you usually do not take a cut.");
        }
    }

});


LazySplit.LootController = Ember.ArrayController.extend({
    needs: ['merchant'],
    p: Ember.A(),
    actions: {
        helpLootName: function () {
            this.get('controllers.alert').showAlert("WHAT'S THIS?", "The loot name is mainly to keep track of the batches of loot sold. You can leave this field empty if you wish.");

        },

        helpBankBalanceChanged: function () {
            this.get('controllers.alert').showAlert("WHAT'S THIS?", "After selling one batch of loot and depositing all gold on hand, type 'show summary' and key in the amount under 'bank balance changed'. This amount will be used to calculate the amount of gold from selling the batch of loot, and will also be used to calculate the amount of gold from selling the next batch of loot.");

        }
    },
    manageIndividuals: function () {
        console.log("content observer firing");

        var self = this;

        if (this.content.length > 0) {

            var lastObject = this.content[this.content.length - 1];

            lastObject.peopleInSplit.forEach(function (person) {

                var existingPerson = self.p.findBy("name", person);


                if (existingPerson) {
                    existingPerson.set('amount', existingPerson.get('amount') + lastObject.get('lootPerPersonAfterMerchantCut'));
                }

                else {
                    self.p.pushObject(Ember.Object.create({"name": person, "amount": lastObject.get('lootPerPersonAfterMerchantCut') }));
                }

            });


        }

        console.log(this.p);

    }.observes('content.@each')
});

LazySplit.Loot = Ember.Object.extend({
    name: null,
    bankBalanceChanged: null,
    previousBankBalanceChanged: null,
    peopleInSplit: null,
    numberOfPeopleInSplit: null,
    merchantPercentage: null,
    lootAmount: null,
    merchantCut: null,
    lootAfterMerchantCut: null,
    lootPerPersonAfterMerchantCut: null,

    init: function () {
        this.set('lootAmount', (this.bankBalanceChanged - this.previousBankBalanceChanged));
        this.set('merchantCut', (this.lootAmount * this.merchantPercentage / 100));
        this.set('lootAfterMerchantCut', (this.lootAmount * (100 - this.merchantPercentage) / 100));
        this.set('numberOfPeopleInSplit', this.peopleInSplit.length);
        this.set('lootPerPersonAfterMerchantCut', (this.lootAfterMerchantCut / this.numberOfPeopleInSplit));
    }

});

LazySplit.LootFormViewController = Ember.ObjectController.extend();

LazySplit.LootFormView = Ember.View.extend({
    name: null,
    bankBalanceChanged: null,
    peopleInSplit: null,

    templateName: "lootform",

//    must check that current bank balance changed and previous bank balance not same or less than
    actions: {

        addLoot: function () {
            console.log("controller: " + this.get('controller'));
            console.log(this.get('controller').get('controllers.merchant').get('percentageCut'));

            if (this.checkInput()) {
                this.get('controller').pushObject(LazySplit.Loot.create({"name": this.name, "bankBalanceChanged": parseInt(this.bankBalanceChanged, 10), "previousBankBalanceChanged": parseInt(this.getPreviousBankBalanceChanged(), 10), "peopleInSplit": this.parsePeopleInSplit(), "merchantPercentage": parseInt(this.get('controller').get('controllers.merchant').get('percentageCut'), 10)}));
                this.reset();

            }
        }
    },

    getPreviousBankBalanceChanged: function () {

        if (this.get('controller').get('model').length == 0 || !(this.get('controller').get('model'))) {
            return this.get('controller').get('controllers.merchant').get('bankBalanceChanged');
        }

        else {
            return this.get('controller').get('model').get('lastObject').get('bankBalanceChanged');
        }
    },

    parsePeopleInSplit: function () {

        var str = this.peopleInSplit;
        var arr = str.toUpperCase().replace(' ', '').split(",");

        return arr;
    },

    checkInput: function () {

        if (!this.checkCurrentBankBalanceGreater()) {
            this.get('controller').get('controllers.alert').showAlert("WARNING", "Amount must be greater than previous Bank Balance Changed");
            return false;
        }

        else if (!this.checkPeopleInSplit()) {
            this.get('controller').get('controllers.alert').showAlert("WARNING", "You must have someone to split loot with!");
            return false;
        }

        //check bank balance changed input is not empty
        else if (this.bankBalanceChanged == null||this.bankBalanceChanged ==="") {
            this.get('controller').get('controllers.alert').showAlert("WARNING", "You must have some loot to split!");
            return false;
        }

        else {
            return true;
        }
    },

    checkCurrentBankBalanceGreater: function () {

        if (parseInt(this.bankBalanceChanged, 10) <= parseInt(this.getPreviousBankBalanceChanged(), 10)) {

            return false;
        }

        else {

            return true;
        }
    },

    checkPeopleInSplit: function () {
        if (this.peopleInSplit == null||this.peopleInSplit ==="") {
            return false;
        }

        else {
            return true;
        }
    },

    reset: function () {
        this.set('name', null);
        this.set('bankBalanceChanged', null);
        this.set('peopleInSplit', null);
    }

});


LazySplit.IndexRoute = LazySplit.AppRoute.extend({

    setupController: function (controller) {
        this.controllerFor('merchant').set('model', LazySplit.Merchant.create());
        this.controllerFor('loot').set('model', []);
    },

    renderTemplate: function () {
        this.render('merchant', {
            outlet: 'merchant'
        });


        this.render('loot', {
            outlet: 'loot'
        });

        this.render('individual', {
            outlet: 'individual'
        });

    }
});

LazySplit.IndexController = Ember.ObjectController.extend({

    needs: ['merchant', 'loot']
});


//    window.setRouter();
//});
