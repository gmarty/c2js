/**
 * I wrote this script to help me porting a C application to JavaScript.
 * I decided to use several regexp replacements rather than a parser.
 * The set of regexp is very limited and developped for a particular project
 * in mind, as such I strongly recommend against its use.
 *
 * @todo Things to implement:
 *  * Transform '#define' to 'var/const'.
 *  * Variable declarations to 'var'.
 */

var sys = require('sys'),
    fs = require('fs'),
    file = process.argv[2],
    cSource = fs.readFileSync(file, 'utf-8');

cSource = replace(cSource, [
  [/\t/g, '  '],
  [/#include/g, '// #include'],
  [/->/g, '.'],
  [/\b==\b/g, ' === '],
  [/\bNULL\b/g, 'null'],
  [/#if 0/g, 'if (0) {'],
  [/#ifdef (.+)/g, 'if ($1) {'],
  [/#else/g, '} else {'],
  [/#endif/g, '}'],

  // Remove &var and *var notations.
  [/&([a-zA-Z_]+)/g, '$1'],
  [/\*([a-zA-Z_]+)/g, '$1'],

  // One line '/*'' style comments to '//'.
  [/\/\*(.+)\*\//g, function(a, b) {
    return '// ' + b.trim();
  }],

  // Specific rules.
  // @todo Remove the last \n in fprintf.
  [/fprintf\(MSG_OUT, *([^)]+)/g, 'printf($1'],
  [/fprintf\(MSG_OUT, */g, 'printf('],
  [/fprintf\(stderr, *([^)]+)\)/g, 'console.error(sprintf($1))'],
  [/\bTRACE\b/g, 'DEBUG'],

  // Parse functions and generate JS equivalent + JSDoc annotations.
  [/\n([a-z0-9_* ]+) ([^ ]+)\(([^);&|=.]*)\)/g, function(s, returnType, functionName, parameters) {
    var str = '\n',
        i, tmp,
        argType, argName, argReference,
        args = [],
        returnJSType;

    sys.puts('returnType', sys.inspect(returnType));

    // We do not parse native C functions.
    if (isNativeFunction(returnType.trim()) || isNativeFunction(functionName.trim())) {
      return '\n' + returnType + ' ' + functionName + '(' + parameters + ')';
    }

    // Check reference notation.
    if (functionName.substr(0, 1) === '*') {
      argReference = true;
      functionName = functionName.substr(1).trim();
    } else {
      argReference = false;
    }

    // Start annotation block.
    if (returnType.length || parameters.length) {
      str += '/**\n';

      if (argReference) {
        str += ' * Function passed as reference.\n';
      }
    }

    // '@param' annotations.
    if (parameters) {
      parameters = parameters.split(',');
      for (i = 0; i < parameters.length; i++) {
        tmp = parameters[i].trim().split(' ');
        argType = tmp[0].trim();
        argName = tmp[1];

        if (argName.substr(0, 1) === '*') {
          argReference = true;
          argName = argName.substr(1).trim();
        } else if (argType.substr(-1, 1) === '*') {
          argReference = true;
          argType = argType.substr(0, argType.length - 1).trim();
        } else {
          argReference = false;
        }
        args.push(argName);

        str += ' * @param {' + getCType(argType) + '} ' + argName;
        str += argReference ? ' (passed as reference)' : '';
        str += '\n';
      }
    }

    // '@return' annotations.
    if (returnType) {
      returnType = returnType.split(' ');
      for (i = 0; i < returnType.length; i++) {
        returnJSType = getCType(returnType[i]);
        str += returnJSType ? ' * @return {' + getCType(returnType[i]) + '}\n' : '';
      }
    }

    // Close annotation block.
    if (str.length > 1) {
      str += ' */\n';
    }

    str += 'function ' + functionName + '(' + args.join(', ') + ')';

    return str;

    /**
     * Looks for native C function. Returns true if so.
     * @param {string} str
     * @return {boolean}
     */
    function isNativeFunction(str) {
      str = str.trim();

      switch (str) {
        case '':
        case 'if':
        case 'switch':
        case 'while':
        case 'printf':
        case 'fprintf':
        case 'return':
          return true;
      }

      return false;
    }

    /**
     * Returns a JavaScript primitive given a C type.
     * @param {string} str
     * @return {string}
     */
    function getCType(str) {
      str = str.trim();

      switch (str) {
        case 'unsigned':
        case 'int':
        case 'int16_t':
        case 'int32_t':
        case 'uint8_t':
        case 'uint16_t':
        case 'uint32_t':
          return 'number';
        case 'void':
        case 'static':
          return '';
      }

      return str;
    }
  }]
]);

function replace(str, pairs) {
  var i = 0,
      len = pairs.length;

  for (; i < len; i++) {
    str = str.replace(pairs[i][0], pairs[i][1]);
  }

  str = str.trim();

  return str;
}

//return;

sys.puts(cSource);
