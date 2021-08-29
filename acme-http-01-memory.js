'use strict';
const Deferred = require('node-promise').defer;
module.exports.create = function (defaults) {
    var handlers = {
        getOptions: function () {
            return defaults;
            
        }
        //
        // set,get,remove challenges
        //
        // Note: this is fine for a one-off CLI tool
        // but a webserver using node-cluster or multiple
        // servers should use a database of some sort
        , _challenges: {}
        , set: function (args) {

            let deferred = Deferred();
            handlers._challenges[args.challenge.token] = args.challenge;
            deferred.resolve();
            return deferred.promise;
        }
        , get: function (args) { //(args, domain, token) {
            let deferred = Deferred();
            // TODO keep in mind that, generally get args are just args.domains
            // and it is disconnected from the flow of setChallenge and removeChallenge
            //cb(null, handlers._challenges[token]);
            try {
                deferred.resolve(handlers._challenges[args.token]);
            } catch (ex) {
                deferred.reject(ex);
            }
            return deferred.promise;
        }
        , verify: function (args) { //(args, domain, token) {
            let deferred = Deferred();
            // TODO keep in mind that, generally get args are just args.domains
            // and it is disconnected from the flow of setChallenge and removeChallenge
            //cb(null, handlers._challenges[token]);
            try {
                handlers._challenges[args.token].verified = true;
                deferred.resolve(handlers._challenges[args.token]);
            } catch (ex) {
                deferred.reject(ex);
            }
            return deferred.promise;
        }
        , remove: function (args, domain, token) {
            let deferred = Deferred();
            delete handlers._challenges[args.challenge.token];
            deferred.resolve();
            return deferred.promise;
        }

        

    };


    return handlers;
};