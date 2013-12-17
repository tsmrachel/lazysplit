module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // please refer to "path" in package.json
        // defining paths of /scripts/ in app & dist folder
        appScripts: '<%= pkg.path.app %>/<%= pkg.path.scripts %>',
        distScripts: '<%= pkg.path.dist %>/<%= pkg.path.scripts %>',

        // defining paths of /scripts/modules/ in app & dist folder
        appModules: '<%= appScripts %>/<%= pkg.path.modules %>',
        distModules: '<%= distScripts %>/<%= pkg.path.modules %>',

        // defining path of source and compiled template in app folder
        sourceTemplates: '<%= pkg.path.app %>/<%= pkg.path.templates %>/<%= pkg.path.html %>',
        compiledTemplates: '<%= pkg.path.app %>/<%= pkg.path.templates %>/<%= pkg.path.js %>',

        meta: {
            banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
                '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
                ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
        },
        ember_handlebars: {
            compile: {
                options: {
                    processName: function(filePath) {
                        var data = filePath.substring(filePath.lastIndexOf('/') + 1,filePath.length);
                        var arr=[];
                        arr = data.split(".");
                        return arr[0];
                    }
                },
                files: [
                    {
                        expand: true,     // Enable dynamic expansion.
                        cwd: '<%= sourceTemplates %>/',      // Src matches are relative to this path.
                        src: ['**/*.hbs'], // Actual pattern(s) to match.
                        dest: '<%= compiledTemplates %>/',   // Destination path prefix.
                        ext: '.js'   // Dest filepaths will have this extension.
                    }
                ]
            }
        },

        concat:{

            main:{
                src:[
                    // File's sequence MATTERS

                    '<%= compiledTemplates %>/application/application.js',

                    '<%= compiledTemplates %>/application/alert.js',


                    '<%= compiledTemplates %>/merchant/merchant.js',
                    '<%= compiledTemplates %>/loot/lootform.js',
                    '<%= compiledTemplates %>/loot/loot.js',

                    '<%= compiledTemplates %>/individual/individual.js',

                    '<%= appScripts %>/common/documentReadyStart.js',
                    '<%= appScripts %>/common/application.js',
                    '<%= appScripts %>/common/router.js',


                    '<%= appScripts %>/common/documentReadyEnd.js'



                ],
                dest: '<%= distScripts %>/common/common.js'
            },

            library:{
                src:[
                    '<%= appScripts %>/lib/jquery-2.0.3.js',
                    '<%= appScripts %>/lib/handlebars-1.0.0.js',
                    '<%= appScripts %>/lib/ember.js',
                    ],
                dest:'<%= distScripts %>/lib/lib.js'
            }
        },

        min:{
            application:{
                src:['<config:concat.application.dest>'],
                dest: '<config:concat.application.dest>'
            },
            initial:{
                src:['<config:concat.initial.dest>'],
                dest: '<config:concat.initial.dest>'
            },
            main:{
                src:['<config:concat.main.dest>'],
                dest: '<config:concat.main.dest>'
            },
            library:{
                src:['<config:concat.library.dest>'],
                dest: '<config:concat.library.dest>'
            }
        },
//        copy: {
//            dist: {
//                files: [
//                    {
//                        expand: true,
//                        cwd: 'app',
//                        src: ['**'],
//                        dest: 'dist'
//                    }
//                ]
//            }
//        },

        clean: {
            dist: "dist/",
            jsTemplate: "app/templates/html/**/*.js"
        },

        watch: {
            files: ['app/**/*'],
            tasks: ['default']
        },

        compass: {
            prod: {
                options: {
                    config: 'config.rb'
                }
            }
        },

        htmlmin: {
            dist: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: {
                    'dist/index.html': 'app/index.html'
                }
            }
        },

        uglify: {
            my_target: {
                files: {
                    // file from common
                    '<%= distScripts %>/common/common.js': ['<%= distScripts %>/common/common.js'],

                    // file from lib
                    '<%= distScripts %>/lib/lib.js': ['<%= distScripts %>/lib/lib.js']

                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-ember-handlebars');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');


    grunt.registerTask('default', [
        'clean',
        'ember_handlebars',
        'concat',
//        'copy:dist',
        'htmlmin',
        'compass',
    ]);

    grunt.registerTask('production', [
        'default',
        'uglify',
    ]);
};