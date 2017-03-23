var Generator = require('yeoman-generator');

module.exports = class extends Generator {
  // The name `constructor` is important here
  constructor(args, opts) {
    // Calling the super constructor is important so our generator is correctly set up
    super(args, opts);

    // Next, add your custom code
    this.option('babel'); // This method adds support for a `--babel` flag
  }

	prompting() {
		return this.prompt([{
			type    : 'input',
			name    : 'name',
			message : 'Project name / gcp namespace',
			store   : true,
			default : this.appname // Default to current folder name
		}, {
			type    : 'input',
			name    : 'load_balancer_ip',
			message : 'Load balancer ip',
			store   : true
		}, {
			type    : 'input',
			name    : 'production_domain',
			message : 'Production domains (for ssl cert)',
			store   : true
		}, {
			type    : 'input',
			name    : 'replica_count',
			message : 'Replica Count',
			store   : true,
			default : 1
		}, {
			type    : 'input',
			name    : 'slack_token',
			message : 'Slack token (Travis notifs)',
			store   : true
		}]).then((answers) => {
			this.fs.copyTpl(
				this.templatePath('**/*'),
				this.destinationPath('.'),
				answers
			)
		});
	}
};
