
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
/**
 * @module form
 */
var v, f, Promise, _;

Promise = require('bluebird');

v = require('../visuals');

f = require('resin-cli-form');

_ = require('lodash');

exports.run = function(form, options)
{
    var questions = parse(form);

    return Promise.reduce(questions, function(answers, question)
    {
        if ((question.shouldPrompt != null) && !question.shouldPrompt(answers))
        {
            return answers;
        }

        var override, validation;
        override = _.get(options.override, question.name);
        if (override != null)
        {
            validation = (question.validate || _.constant(true))(override);
            if(_.isString(validation))
            {
                throw new Error(validation);
            }
            if (!validation)
            {
                throw new Error("" + override + " is not a valid " + question.name);
            }
            answers[question.name] = override;
            return answers;
        }

        if (question.type === 'kios')
        {
            return v.kios.ask(question.message).then(function(release) {
                answers[question.name] = release;
                return answers;
            });
        }
        else if (question.type === 'wifi')
        {
            return v.wifi.ask(question.message).then(function(wifi) {
                answers[question.name] = wifi;
                return answers;
            });
        }
        else if (question.type === 'ip')
        {
            return v.ip.ask(question.message).then(function(ip) {
                answers[question.name] = ip;
                return answers;
            });
        }
        else if (question.type === 'netmask')
        {
            return v.netmask.ask(question.message).then(function(netmask) {
                answers[question.name] = netmask;
                return answers;
            });
        }
        else if (question.type === 'gateway')
        {
            return v.gateway.ask(question.message).then(function(gateway) {
                answers[question.name] = gateway;
                return answers;
            });
        }
        else
        {
            // remove shouldPrompt function, already
            // solved before..

            question.shouldPrompt = null;
            return exports.ask(question).then((answer) => {
                answers[question.name] = answer;
                return answers;
            });
        }

    }, {})
    .then((answers) => {
        return answers;
    })
}

exports.ask = f.ask;

var flatten = function(form) {
  return _.flatten(_.map(form, function(question) {
    if (question.isGroup) {
      return flatten(question.options);
    }
    return question;
  }));
};

var parse = function(form) {
  form = flatten(form);
  return _.map(form, function(option) {
    var result;
    result = _.omit(_.cloneDeep(option), 'when');
    if (!_.isEmpty(option.when)) {
      result.shouldPrompt = function(answers) {        
        if (answers == null) {
          return false;
        }
        return _.every(_.map(option.when, function(value, key) {
          var answer;
          answer = _.get(answers, key);
          if (value === true && Boolean(answer))
          {
            return true;
          }
          return answer === value;
        }));
      };
    }
    return result;
  });
};