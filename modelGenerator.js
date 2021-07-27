const fs = require("fs");
const path = require("path");

function words (str) {
  const types = [
    {
      name: 'Boolean', list: [
        'root',
        'pass',
        'is.*'
      ]
    },
    {
      name: 'Date', list: [
        '.*time',
        '.*expires',
        '.*expire',
        'createdAt',
        'updatedAt',
        'publish',
        'start',
        'end'
      ]
    },
    {
      name: 'Number', list: [
        'price',
        'min.*',
        'max.*',
        'amount',
        'value',
        'status',
        '.{1}id',
        '.*score',
        'stock',
        'salary',
        'cost',
        'total',
        'ticket',
        'point',
        'rank',
        'win',
        'bonus',
        'height',
        'weight',
        'age',
        'times',
        'current',
        'type',
        'types',
        'difficulty',
        'order',
        'money',
        'diamond',
    ]},
  ]
  // console.log(str);
  let temp = str.trim()
  temp = temp.replace(/ +/g, ' ')
  // console.log(temp);
  const value = temp.split(' ')
  // console.log(value);
  if (value.length >= 1) {
    const name = value[0].trim()
    let commit = ''
    if (value.length >= 2) {
      commit = value[1].trim()
    }
    let type = 'String'
    for (const t of types) {
      const current = t.name
      for (const key of t.list) {
        if (name === key) {
          type = current
          break
        }
      }
    }
    return { name , type , commit }
  } else {
    return ''
  }
}

function processor(file) {
  const base = (fs.readFileSync(file, 'utf8'));

  const models = []
  base.split(/\r?\n/).forEach(function(line) {
    if (/^#/.test(line)) {
      const str = line.replace(/#*/, '')
      const value = str.trim().split(' ')
      if (value.length >= 2) {
        models.push({
          name: value[0].trim(),
          commit: value[1].trim(),
          list: []
        })
      }
    }else if (/^>/.test(line)) {
      // console.log( " commit ",line );
    }else if (line === '' || line.trim() === '') {
      // console.log( " blank ",line );
    } else {
      // console.log(" centent ", line);
      const obj = words(line)
      models[models.length - 1].list.push(obj)
      // console.log(str);
    }
    
  });

  for (const model of models) {
    for (const prop of model.list) {
      for (const m of models) {
        if (prop.name === m.name || prop.name + 's' === m.name ||
        prop.name.toLowerCase() === m.name.toLowerCase()) {
          prop.type = 'mongoose.Schema.Types.ObjectId'
          prop.ref = upper(m.name)
        }
      }
    }
  }
  // console.log(JSON.stringify(models, null, 2));

  return models
}
function upper (name) {
  return name.charAt(0).toUpperCase() + name.slice(1)
}
function printjs (json) {
  const objs = []
  for (const model of json) {
    const upperName = upper(model.name)
    const fisrt = model.list[0].name
    const props = []
    for (const prop of model.list) {
      if (prop.ref) {
        props.push(`${prop.name}: { type: ${prop.type}, ref: ${prop.ref} }, // ${prop.commit}`)
      } else {
        props.push(`${prop.name}: { type: ${prop.type} }, // ${prop.commit}`)
      }
    }
    const str = `
module.exports = app => {
  const mongoose = app.mongoose
  const ${upperName}Schema = new mongoose.Schema(
    {
      ${props.join("\n      ")}
    },
    { timestamps: true }
  )

  ${upperName}Schema.methods.toString = function () {
    return this.${fisrt}
  }

  return mongoose.model('${upperName}', ${upperName}Schema)
}
`
    objs.push(str)
  }
  return objs.join("\n")
}

;(async () => {
  const file = process.argv.splice(2)[0];
  if(file==""){
    console.log("Error:file is required.");
    console.log("Usage:node js2bytecode file(.js)");
  }
  // console.log(file);
  const str = printjs(processor(file))
  console.log(str);

})()