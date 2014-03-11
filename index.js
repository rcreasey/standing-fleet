require('simple-ioc')
	.register('fs', require('fs'))
	.register('express', require('express'))
	.register('_', require('lodash'))
	.register('async', require('async'))
	.register('mongodb', require('mongodb'))
	.register('rawbody', require('raw-body'))

	.autoRegister('./lib/')
	.autoRegister('./config/')
	.start(function(expressSetup, settings) {
		expressSetup.start(settings.port);
	});