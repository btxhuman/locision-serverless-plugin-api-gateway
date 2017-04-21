'use strict';

var _ = require('underscore'),
    Class = require('class.extend');

module.exports = Class.extend({

    init: function (serverless, opts) {
        this._serverless = serverless;
        this._opts = opts;

        this.hooks = {
            'before:deploy:deploy': this.amendResources.bind(this),
        };
    },

    amendResources: function () {
        var self = this;
        var resources = self._serverless.service.provider.compiledCloudFormationTemplate.Resources;

        if(resources.hasOwnProperty('ApiGatewayRestApi')){
            /**
             * 刪除servreless自动创建的api gateway
             * */
            delete resources['ApiGatewayRestApi'];
            var apiGatewayId = JSON.stringify({"Ref": "ApiGatewayRestApi"});
            var apiGatewayRootResourceId = JSON.stringify({"Fn::GetAtt": ["ApiGatewayRestApi", "RootResourceId"]});

            var customApiGatewayId = self._serverless.service.custom.apiGatewayId;
            var customApiGatewayRootResourceId = self._serverless.service.custom.apiGatewayRootResourceId;

            for (var resource in resources) {
                var value = JSON.stringify(resources[resource]);
                value = value.replace(apiGatewayId, '"' + customApiGatewayId + '"').replace(apiGatewayRootResourceId, '"' + customApiGatewayRootResourceId + '"');
                resources[resource] = JSON.parse(value);
            }
        }

        if (self._serverless.service.provider.compiledCloudFormationTemplate.Outputs.hasOwnProperty('ServiceEndpoint')) {
            var endpoint = JSON.stringify(self._serverless.service.provider.compiledCloudFormationTemplate.Outputs.ServiceEndpoint.Value);
            self._serverless.service.provider.compiledCloudFormationTemplate.Outputs.ServiceEndpoint.Value = JSON.parse(endpoint.replace(apiGatewayId, '"' + customApiGatewayId + '"'));
        }
        console.log("replace api gateway successfully");
    }
});