const chalk = require('chalk');
const lint = require('../lint');

module.exports = (api, options = {}) => {
  console.log('options:' + options);

  const { overwriteConfig } = options;
  if (overwriteConfig === 'abort') {
    api.exitLog(chalk`{yellow Plugin setup successfully cancelled}`, 'warn');
    return;
  }

  let { lintStyleOn = [] } = options;
  if (typeof lintStyleOn === 'string') {
    lintStyleOn = lintStyleOn.split(',');
  }

  const pkg = {
    scripts: {
      'lint:style': 'vue-cli-service lint:style',
    },
    devDependencies: {},
    vue: {
      pluginOptions: {
        lintStyleOnBuild: lintStyleOn.includes('build'),
        stylelint: {},
      },
    },
    stylelint: {
      root: true,
    },
  };

  const { config = 'stylelint-config-standard' } = options;
  if (typeof config === 'string' || Array.isArray(config)) {
    pkg.stylelint.extends = config;
    if (typeof config === 'string') {
      if (config === 'stylelint-config-standard') {
        Object.assign(pkg.devDependencies, {
          'stylelint-config-standard': '^18.2.0',
        });
      } else if (config === 'stylelint-config-primer') {
        Object.assign(pkg.devDependencies, {
          'stylelint-config-primer': '^2.2.5',
        });
      } else if (config === '@ascendancyy/stylelint-config-kanbaru') {
        Object.assign(pkg.devDependencies, {
          '@ascendancyy/stylelint-config-kanbaru': '^1.0.1',
        });
      }
    }
  } else {
    Object.assign(pkg.stylelint, config);
  }

  // add plugin stylelint-no-unsupported-browser-features
  const { checkBrowserSupportFeatures } = options;
  if (checkBrowserSupportFeatures) {
    pkg.stylelint.plugins = ["stylelint-no-unsupported-browser-features"]
    pkg.stylelint.rules = {
      "plugin/no-unsupported-browser-features": [true, {
        "severity": "warning",
        "ignore": ["rem"]
      }]
    }
    Object.assign(pkg.devDependencies, {
      "stylelint-no-unsupported-browser-features": "^3.0.2"
    });
  }
  
  // add custom rules
  const { rules = {} } = options;
  Object.assign(pkg.stylelint.rules, rules)

  if (lintStyleOn.includes('commit')) {
    Object.assign(pkg.devDependencies, {
      'lint-staged': '^6.0.0',
    });
    pkg.gitHooks = {
      'pre-commit': 'lint-staged',
    };
    pkg['lint-staged'] = {
      '*.{vue,htm,html,css,sss,less,scss}': ['vue-cli-service lint:style', 'git add'],
    };
  }

  api.render('./template');
  api.addConfigTransform('stylelint', {
    file: {
      js: ['.stylelintrc.js', 'stylelint.config.js'],
      json: ['.stylelintrc', '.stylelintrc.json'],
      yaml: ['.stylelintrc.yaml', '.stylelintrc.yml'],
    },
  });
  api.extendPackage(pkg);

  api.onCreateComplete(async () => { await lint(api, { silent: true }); });
};
