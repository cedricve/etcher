
/*
Copyright 2016 Resin.io

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */
var DynamicInput, Promise, _, chalk, os, async, ping;

_ = require('lodash');

chalk = require('chalk');

Promise = require('bluebird');

DynamicInput = require('./../../input.js');

os = require('os');

async = require('async');

ping = require('ping');

/**
 * @summary Prompt the user to select a drive device
 * @name drive
 * @function
 * @public
 * @memberof visuals
 *
 * @description
 * The dropdown detects and autorefreshes itself when the drive list changes.
 *
 * @param {String} [message='Select a drive'] - message
 * @returns {Promise<String>} device path
 *
 * @example
 * visuals.drive('Please select a drive').then (drive) ->
 * 	console.log(drive)
 */

exports.getAvailableIP = function ()
{
    return new Promise((resolve, reject) => {

    var interfaces = os.networkInterfaces();
    var addresses = [];
    for (var k in interfaces)
    {
        for (var k2 in interfaces[k])
        {
            var address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal)
            {
                addresses.push(address.address);
            }
        }
    }
    if(addresses.length > 0)
    {
        ip = addresses[0];
        var suffix = (parseInt(ip.split(".").pop()))%250;
        ip = ip.substr(0, ip.lastIndexOf('.')+1);;

        // Search for the first free host on the network..
        var freeHost  = undefined;
        async.whilst(function()
        {
            return freeHost == undefined;
        },
        function(next)
        {
            ping.sys.probe(ip + suffix, function(isAlive)
            {
                if(!isAlive)
                {
                    freeHost = ip + suffix;
                }
                else
                {
                    suffix = (suffix + 1)%250;
                }

                next();
            });   
        },
        function(next)
        {   
            resolve(freeHost);
        });
    }
    });
};

exports.ask = function(message)
{
    if(message == null)
    {
        message = 'Specify an ip';
    }
    
    return new Promise((resolve, reject) => {
        return exports.getAvailableIP().then((ip) => {
            resolve(ip);
        });
    })
    .then((ip) => {

        input = new DynamicInput({
            message: message,
            emptyMessage: (chalk.red('x')) + " No ip was specified!",
            default: ip
        });

        return input.run().catch(function (err) 
        {
            // Crawling failed... 
            console.log(err);
        });
    });
};