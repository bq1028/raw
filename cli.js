var fs = require('fs'),
    path = require('path'),
    marked = require('marked'),
    yaml = require('js-yaml'),
    mkdirp = require('mkdirp'),
    swig = require('swig')

require('node-slug').slug()

var dir = __dirname + '/_posts/',
    encoding = 'utf-8',
    api_posts = __dirname + '/api/',
    index = {config: {}, posts: []}

mkdirp.sync(api_posts)
var config = yaml.load(fs.readFileSync('config.yaml', encoding))

fs.readdir(dir, function (err, temp_files) {
  var files = []
  for(var i in temp_files) {
    var ext = path.extname(temp_files[i])
    if(ext == '.md' || ext == '.markdown'){
      files.push(temp_files[i])
    }
  }

  files.forEach(function(file, ord) {
    var file_content = fs.readFileSync(dir + file, encoding)
    var file_arr = file_content.split('---')
    var os = (file_arr[0] === '' ? 'jekyll' : 'hexo')
    var meta = (os === 'jekyll' ? yaml.load(file_arr[1]) : yaml.load(file_arr[0]))
    var slug = meta.title.slug()
    var atime = fs.statSync(dir + file).birthtime
    index.posts.push({
      ord: ord,
      title: meta.title,
      slug: slug,
      atime: atime
    })
    var content = (os === 'jekyll' ? marked(file_arr[2]) : marked(file_arr[1]))
    var post = {
      ord: ord,
      title: meta.title,
      slug: slug,
      content: marked(content),
      atime: atime
    }
    post = JSON.stringify(post, null, 4)
    fs.writeFileSync(api_posts + slug + '.json', post, encoding)
    if(files.length == ord + 1){
      tpl = swig.compileFile(__dirname + '/' + config.theme + '.swig')
      var date = new Date
      config.build = date.getTime()
      index.config = config
      index.posts.sort(function (a, b) {
        return new Date(b.atime) - new Date(a.atime);
      })
      var json = JSON.stringify(index, null, 4)
      fs.writeFileSync(api_posts + 'index.json', json, encoding)
      fs.writeFileSync(__dirname + '/index.html', tpl(index), encoding)
      return
    }
  })
})