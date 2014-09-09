// require('newrelic');
if(process.env.NODETIME_ACCOUNT_KEY) {
	require('nodetime').profile({
		accountKey: process.env.NODETIME_ACCOUNT_KEY,
		appName: 'Standing Fleet'
	});
}

require('simple-ioc')
	.register('_', require('lodash'))
	.register('async', require('async'))
	.register('chunk', require('chunk'))
	.register('CrowdStrategy', require('./passport/crowd').Strategy)
	.register('express', require('express'))
	.register('flash', require('connect-flash'))
	.register('fs', require('fs'))
	.register('mongodb', require('mongodb'))
	.register('mongoose', require('mongoose'))
	.register('neow', require('neow'))
	.register('passport', require('passport'))
	.register('Q', require('q'))
	.register('rawbody', require('raw-body'))


	.autoRegister('./lib/')
	.autoRegister('./config/')
	.start(function(expressSetup, settings) {
		expressSetup.start(settings.port || process.env.PORT || 5000);
	});
