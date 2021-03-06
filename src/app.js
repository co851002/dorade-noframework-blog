/*
* Including the CSS (the non-blocking one)
* Webpack will inline or copy all url() references in there
*/
require('materialize-css/dist/css/materialize.min.css');
// I could split my CSS and load it in the page-specific scripts.
require('../styles/base.css');

/*
* Initialize the global app object
* This could be put in a separate file and
* included with the rest of the JS below.
*/
var app = {
  titleBase: 'Blog des gens compliqués',
  apiUrl: 'https://api.dkvz.eu',
  jsDir: 'scripts',
  quotes: [
    'Vas-y répète le mot trompette dans ta tête',
    'Les SITES INTERNET doivent avoir un sous-titre',
    'Si Gargamel mange tous les schtroumpfs y a plus d\'histoire',
    'Optimisation de la conversion Kasteel Bier en lignes de code',
    'Le Teflon n\'accroche pas mais il est collé sur la poêle?',
    'Kesse tu fais ici va prendre un bain',
    'La monogamie aurait provoqué la disparition de l\'os pénien',
    'Ces comme meme pas mal qu\'on sois allée sur la lune',
    'Péter un plomb et peindre tout en brun',
    'Nous paissons, vous paissez, ils paissent',
    'Qui a commandé un décacapou?',
    'Dkvz.eu recommande officiellement la Bing toolbar'
  ],
  fragments: {
    short: {
      filename: '_breve.html',
      properties: [
        {name: 'thumbImage'},
        {name: 'title'},
        {name: 'summary'},
        {name: 'date', process: function(val) {
          // My dates are weird strings that can't be used
          // in the Date constructor.
          if (val !== undefined && val.length > 10) {
            return val.substr(0, 10);
          }
          return '';
        }},
        {name: 'content'},
        {name: 'id'},
        {name: 'layout'}
      ]
    },
    articleCard: {
      filename: '_articleCard.html',
      properties: [
        {name: 'thumbImage'},
        {name: 'hideThumbImage'},
        {name: 'title'},
        {name: 'summary'},
        {name: 'layout'},
        {
          name: 'tags', 
          template: 'tag', 
          properties: [
            {name: 'id'},
            {name: 'name'},
            {name: 'nameEncoded'}
          ]
        },
        {name: 'date', process: function(val) {
          // I'll have to do something about the date
          // format one day.
          return val;
        }},
        {name: 'author'},
        {name: 'articleURL'},
        {name: 'commentsCount'}
      ]
    },
    articles: {
      filename: 'articles.html',
      script: 'articles.js'
    },
    article: {
      filename: 'article.html',
      script: 'article.js'
    },
    articleContent: {
      filename: '_articleContent.html',
      properties: [
        {name: 'title'},
        {name: 'author'},
        {name: 'date'},
        {name: 'author'},
        {name: 'content'},
        {name: 'id'},
        {
          name: 'tags', 
          template: 'tag', 
          properties: [
            {name: 'id'},
            {name: 'name'},
            {name: 'nameEncoded'}
          ]
        }
      ]
    },
    comment: {
      filename: '_comment.html',
      properties: [
        {name: 'number'},
        {name: 'author'},
        {name: 'date'},
        {name: 'comment'}
      ]
    },
    tag: {filename: '_tag.html'},
    home: {filename: 'home.html'},
    about: {
      filename: 'about.html',
      script: 'about.js'
    },
    contact: {
      filename: 'contact.html',
      script: 'contact.js'
    },
    hireme: {
      filename: 'hireme.html',
      script: 'hireme.js'
    },
    menuTag: {
      filename: '_menuTag.html',
      properties: [
        {name: 'name'},
        {name: 'nameEncoded'},
        {name: 'id'}
      ]
    },
    menuTagMobile: {
      filename: '_menuTagMobile.html',
      properties: [
        {name: 'name'},
        {name: 'nameEncoded'},
        {name: 'id'}
      ]
    },
    article404: {filename: '_article404.html'}
  },
  menuItems: [
    'homeL',
    'articlesL',
    'shortsL',
    'aboutL',
    'contactL',
    'hiremeL'
  ],
  loadedCount: 0,
  tags: [],
  currentTags: [],
  currentPage: '',
  maxArticlesHome: 3,
  maxShortsHome: 10,
  maxArticles: 5,
  maxShorts: 20,
  maxComments: 10,
  bottomReached: false,
  orderDesc: true,
  previousDiff: 0,
  previousArticle: '',
  previousPath: '',
  cacheNodes: true,
  homeLayoutA: 'col s12',
  homeLayoutS: 'col l6 m6 s12',
  layoutS: 'col l4 m6 s12',
  toast: function(text) {
    Materialize.toast(text, 4000);
  },
  createElementFromText: function(text) {
    // This weird stuff is required to work with some
    // of the IE versions.
    var div = document.createElement('div');
    div.innerHTML = text;
    if (div.childNodes.length > 1) {
      return div;
    } else {
      return div.firstChild;
    }
  },
  goToTop: function() {
    // Won't work unless the router is instructed to
    // not re-create pages when you change the hash.
    // Setting the hash to '' is necessary for Chrome.
    // No idea why.
    //location.hash = '';
    //location.hash = this.mainEl.id;
    // Because the Chrome hack was making routing proc twice
    // (once for the hash '' and once for the other) I had
    // to use location.href instead. It works on Firefox and
    // webkit based browsers. Also works on Edge.
    //location.href = '#' + this.mainEl.id;
    // OK actually I can just use scrollTo. Yeah.
    window.scrollTo(0,0);
  },
  lazyLoadPage: function(fragment, callback, args) {
    // I use this function to lazy-load JS that
    // also has HTML stringified into it.
    this.showSpinner();
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.src = '/scripts/' + this.fragments[fragment].script;
    // I could use bind() to keep my 'this' context in this onload
    // but it turns out bind() is not supported by IE 9.
    s.onload = function() {
      app._replaceMainContent(fragment, args);
      // We don't hide the spinner here, it's supposed to be done in
      // the callback (or not if you don't want to).
      if (callback !== undefined) callback();
    };
    document.body.appendChild(s);
  },
  showSpinner: function() {
    this.spinner.style.display = '';
  },
  hideSpinner: function() {
    this.spinner.style.display = 'none';
  },
  showOtherSpinner: function(id) {
    var spin = document.getElementById(id);
    if (spin) {
      spin.style.display = '';
    }
  },
  hideOtherSpinner: function(id) {
    var spin = document.getElementById(id);
    if (spin) {
      spin.style.display = 'none';
    }
  },
  randomQuote: function() {
    return this.quotes[Math.floor(Math.random() * this.quotes.length)];
  },
  setActiveMenuTag: function(tagName) {
    // Stuff here could be refactored.
    if (!tagName) {
      document.getElementById('menuTagAll').className = 'active';
      for (var i = 0; i < this.tags.length; i++) {
        document.getElementById('menuTagL' + this.tags[i].id).className = '';
        document.getElementById('menuTagM' + this.tags[i].id).className = '';
      }
    } else {
      for (var i = 0; i < this.tags.length; i++) {
        document.getElementById('menuTagAll').className = '';
        if (this.tags[i].name === tagName || this.tags[i].nameEncoded === tagName) {
          document.getElementById('menuTagL' + this.tags[i].id).className = 'active';
          document.getElementById('menuTagM' + this.tags[i].id).className = 'active';
        } else {
          document.getElementById('menuTagL' + this.tags[i].id).className = '';
          document.getElementById('menuTagM' + this.tags[i].id).className = '';
        }
      }
    }
  },
  setMenuItemActive: function(menuId) {
    for (var i = 0; i < this.menuItems.length; i++) {
      // If my link li elements had more than one class
      // this would NOT work.
      // The classList thing has a toggle method that only
      // works starting from IE 10. So if I need to use that
      // at some point, might as well use jQuery toggle().
      if (this.menuItems[i] === menuId) {
        document.getElementById(menuId).className = 'active';
        document.getElementById(menuId + 'M').className = 'active';
      } else {
        document.getElementById(this.menuItems[i]).className = '';
        document.getElementById(this.menuItems[i] + 'M').className = '';
      }
    }
  },
  changeRandomQuote: function() {
    document.getElementById('randomQuote').innerText = this.randomQuote();
  },
  show404: function()  {
    this.toast('Page introuvable' + 
      '. Vous avez été redirigé vers la page d\'accueil.');
  },
  showArticle404: function(articleId) {
    this.toast('L\'article identifié comme "' + articleId 
      + '" n\'existe pas ou plus.');
  },
  _hashString: function(val) {
    // I'm using the code from this link:
    // https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
    var hash = 0, i, chr;
    for (i = 0; i < val.length; i++) {
      chr = val.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  },
  _hashArgs: function(args) {
    // I use the result of this function to compare args 
    // arrays passed to pages.
    var str = '';
    if (args && args.constructor === Array) {
      for (var i = 0; i < args.length; i++) {
        str += args[i].name + args[i].value;
      }
    }
    return this._hashString(str);
  },
  /**
   * args in an array of objects with keys name and value.
   * Will replace these keys by the values in the template.
   */
  setMainContent: function(fragment, callback, args) {
    if (this.fragments[fragment] !== undefined) {
      // Check if we got the template:
      if (this.fragments[fragment].template !== undefined) {
        this._replaceMainContent(fragment, args);
        // we need to call the provided callback:
        if (callback !== undefined) callback();
      } else {
        // get the template from a lazy loaded script
        // where the template is stringified in.
        this.lazyLoadPage(fragment, callback, args);
      }
    } else {
      // Use the 404 main content.
      // Which consists in showing the toast.
      this.show404();
    }
  },
  _replaceMainContent: function(fragment, args) {
    // This function is supposed to happen strictly after any
    // lazy loading.
    // Check the cache to see if we got a version of this:
    var el;
    if (this.cacheNodes && this.fragments[fragment].cache) {
      var argsHash = this._hashArgs(args);
      for (var i = 0; i < this.fragments[fragment].cache.length; i++) {
        if (this.fragments[fragment].cache[i].args === argsHash) {
          // Found cached nodes.
          el = this.fragments[fragment].cache[i].nodes;
          break;
        }
      }
    }
    if (!el) {
      var fragmentText = this.fragments[fragment].template;
      // Place the "args" into the template:
      if (args && args.constructor === Array) {
        for (var a = 0; a < args.length; a++) {
          var reg = new RegExp('\{\{' + args[a].name + '\}\}', 'g');
          fragmentText = fragmentText.replace(reg, args[a].value);
        }
      }
      // Create the node and cache it if cache is enabled:
      el = this.createElementFromText(fragmentText);
      if (this.cacheNodes) {
        if (!this.fragments[fragment].cache) {
          this.fragments[fragment].cache = [];
        }
        this.fragments[fragment].cache.push(
          {args: this._hashArgs(args), nodes: el}
        );
      }
    }
    // I actually use the id "contentEl" no and not mainEl.
    // Just remove everything from it and add the new content.
    this.removeContentFromNode(this.contentEl);
    // We should ues Modernizr to check if browser is animation capable.
    // Or not I guess it still works if not animation capable.
    this.contentEl.appendChild(this._animateElement(el, 'trans-left'));
  },
  removeContentFromNode: function(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  },
  _fetchArticlesOrShorts: function(start, count, short, order, layout, callback) {
    // If short is defined we load shorts.
    // I'm using the jQuery AJAX stuff since I have jQuery anyway.
    var url = this.apiUrl + (short ? '/shorts-starting-from/' : '/articles-starting-from/') +
      start + '?max=' + count;
    if (order !== undefined) {
      url += '&order=' + order;
    }
    // Currently tags are disabled for shorts. Although they would work in
    // the backend I think.
    if (!short && this.currentTags.length > 0) {
      // URL encode the tags and add them to the URL using comma as separator.
      url += '&tags=';
      for (var i = 0; i < this.currentTags.length; i++) {
        if (i > 0) {
          url += ',';
        }
        url += encodeURIComponent(this.currentTags[i]);
      }
    }
    $.getJSON(url, function(data) {
      // Set ret with the data.
      if (data && data.length) {
        app.loadedCount += data.length;
        for (var d = 0; d < data.length; d++) {
          data[d].layout = '"' + layout + '"';
          if (data[d].thumbImage) {
            data[d].hideThumbImage = '';
          } else {
            data[d].hideThumbImage = 'hide';
          }
        }
      }
      callback(data);
    }).fail(function(xhr, errorText) {
      // If we get a 404 it's no use trying to load more articles.
      // or shorts.
      console.log('HTTP error in fetching articles or shorts - ' 
        + xhr.status);
      callback(null);
    });
  },
  _animateElement: function(element, animation) {
    // This is ugly but IE doesn't support classList.
    // I don't know which IE and I don't care.
    // Actually some of my stuff doesn't even work in IE 8 anyway.
    // I also think the return is probably useless as 
    // the node is supposed to be passed by reference.
    if (element.className.length > 0) {
      element.className += ' ' + animation;
    } else {
      element.className = animation;
    }
    return element;
  },
  loadArticlesOrShorts: function(start, count, short, order, element, layout, callback) {
    // We use the callback here usually to reset a 
    // specific spinner (usually).
    // Check if not undefined before calling it.
    // The spinner to reset is not the same on the home
    // page as compared to the articles page.
    this._fetchArticlesOrShorts(start, count, short, order, layout, function(data) {
      var el = document.getElementById(element);
      if (data !== null && data.length && el) {
        // Let's use a document fragment. We ditch IE 7 but we get
        // only one reflow instead of a lot of them.
        // I think Materialize doesn't support IE 7 anyway.
        var docFrag = document.createDocumentFragment();
        for (var i = 0; i < data.length; i++) {
          // If on articles we need to add a field to tags.
          // We could also fetch it from the general tags array
          // that the app fetched to generate the tag menus.
          if (!short && data[i].tags && data[i].tags.length > 0) {
            for (var t = 0; t < data[i].tags.length; t++) {
              data[i].tags[t].nameEncoded = 
                encodeURIComponent(data[i].tags[t].name);
            }
          }
          var parsedArt = app.parseTemplate(
            short ? 'short': 'articleCard', data[i]
          );
          //var el = document.querySelector('#' + element);
          docFrag.appendChild(
            app._animateElement(app.createElementFromText(parsedArt), 'scale-up')
          );
        }
        if (start === 0) {
          // Cleanup the element content
          app.removeContentFromNode(el);
        }
        el.appendChild(docFrag);
      } else {
        console.log('Got no data or an undefined element to add the data to.')
      }
      if (callback !== undefined) callback();
    });
  },
  parseTemplate: function(fragment, data) {
    var mainTpl = this.fragments[fragment].template;
    for (var i = 0; i < this.fragments[fragment].properties.length; i++) {
      var cur = this.fragments[fragment].properties[i];
      var reg = new RegExp('\{\{' + cur.name + '\}\}', 'g');
      // I only allow one level of repeating content in a template.
      // I'd have to get into something recursive otherwise.
      var value;
      if (cur.process !== undefined) {
        value = cur.process(data[cur.name], data);
      } else {
        value = data[cur.name];
      }
      if (cur.template !== undefined) {
        // The property is an array.
        var result = '';
        for (var x = 0; x < value.length; x++) {
          var tpl = this.fragments[cur.template].template;
          for (var y = 0; y < cur.properties.length; y++) {
            var regTpl = new RegExp('\{\{' + cur.properties[y].name +
              '\}\}', 'g');
            tpl = tpl.replace(regTpl, value[x][cur.properties[y].name]);
          }
          result += tpl;
        }
        value = result;
      }
      if (value !== undefined) {
        mainTpl = mainTpl.replace(
          reg,
          value
        );
      }
    }
    return mainTpl;
  },
  loadTags: function() {
    // This is supposed to be called only once.
    $.getJSON(this.apiUrl + '/tags', function(data) {
      if (data && data.length) {
        var docFragL = document.createDocumentFragment();
        var docFragM = document.createDocumentFragment();
        for (var i = 0; i < data.length; i++) {
          // Add the URL encoded name for the links:
          data[i].nameEncoded = encodeURIComponent(data[i].name);
          app.tags.push(data[i]);
          // I need to add the tags to the document:
          docFragL.appendChild(
            app.createElementFromText(
              app.parseTemplate('menuTag', data[i])
            )
          );
          docFragM.appendChild(
            app.createElementFromText(
              app.parseTemplate('menuTagMobile', data[i])
            )
          );
        }
        document.getElementById('dropdownTags').appendChild(docFragL);
        document.getElementById('nav-mobile').appendChild(docFragM);
      }
    }).fail(function(xhr, errorText) {
      console.log('HTTP error in fetching tags - ' 
        + xhr.status);
      // We could hide or change the nature of what is normally
      // the tag menu.
      this.toast(
        'Le chargement des catégories a échoué. C\'est pas super normal.'
      );
    });
  },
  loadStaticPage: function(page) {
    this.setMenuItemActive(page + 'L');
    this.showSpinner();
    this.disableInfiniteScrolling();
    this.setMainContent(page, function() {
      app.hideSpinner();
    });
  },
  resetBottomReached: function() {
    setTimeout(function() {
      app.bottomReached = false;
    }, 300);
  },
  loadMoreContentOnpage: function(page) {
    console.log('Loading more data...');
    app.bottomReached = true;
    switch(page) {
      case 'articles':
        app.showSpinner();
        app.loadArticlesOrShorts(
          app.loadedCount, 
          app.maxArticles,
          false,
          app.orderDesc ? 'desc' : 'asc',
          'articles',
          app.homeLayoutA,
          function() {
            app.hideSpinner();
            app.resetBottomReached();
          }
        );
        break;
      case 'article':
        console.log('Loading comments...');
        app.showSpinner();
        app.loadComments(
          app.loadedCount, 
          app.maxComments,
          function() {
            app.hideSpinner();
            app.resetBottomReached();
          }
        );
        break;
      case 'breves':
        console.log('Loading more shorts...');
        app.showSpinner();
        app.loadArticlesOrShorts(
          app.loadedCount, 
          app.maxShorts,
          true,
          app.orderDesc ? 'desc' : 'asc',
          'articles',
          app.layoutS,
          function() {
            app.hideSpinner();
            app.resetBottomReached();
          }
        );
        break;
      default:
        // Remove the listener, we're not on a
        // supported page.
        app.disableInfiniteScrolling();
    }
  },
  inifinteScrollCallback: function() {
    // I could use window.innerHeight without jQuery but
    // it's IE 9+ only.
    var inner = $('#mainEl').innerHeight();
    var thres;
    if ($(document).width() > 2000) {
      thres = 900;
    } else if ($(document).width() >= 1300) {
      thres = 580;
    } else {
      thres = 265;
    }
    var curDiff = window.pageYOffset - inner;
    if (Math.abs(curDiff) < thres && 
      Math.abs(curDiff) >= app.previousDiff) {
      if (!app.bottomReached) {
        app.previousDiff = Math.abs(curDiff) - 20;
        app.loadMoreContentOnpage(app.currentPage);
      }
    }
    /* var inner = window.innerHeight;
    var curDiff = window.pageYOffset - inner;
    console.log('Current scroll diff: ' + curDiff);
    if (curDiff > 250 && curDiff >= app.previousDiff) {
      app.previousDiff = curDiff - 20;
      app.loadMoreContentOnpage(app.currentPage);          
    } */
  },
  enableInfiniteScrolling: function() {
    // I need to handle multiple listeners for scroll possibly
    // on the same element, because my fixed navbar thingy uses
    // a scroll listener.
    // Reset previousDiff:
    this.previousDiff = 0;
    window.addEventListener('scroll', app.inifinteScrollCallback);
  },
  disableInfiniteScrolling: function() {
    window.removeEventListener('scroll', app.inifinteScrollCallback);
  },
  showArticlesPage: function() {
    document.title = this.titleBase;
    this.loadedCount = 0;
    // Prevent one extra loading from the infinite
    // scrolling thingy:
    this.bottomReached = true;
    this.orderDesc = true;
    this.showSpinner();
    if (this.currentPage === 'articles') {
      this.setMenuItemActive('articlesL');
      this.setMainContent('articles', function() {
        // The initialization code is lazy loaded.
        if (app.fragments.articles.initPage)
          app.fragments.articles.initPage();
        app.loadArticlesOrShorts(
          0, 
          app.maxArticles,
          false,
          app.orderDesc ? 'desc' : 'asc',
          'articles',
          app.homeLayoutA,
          function() {
            app.hideSpinner();
            app.bottomReached = false;
          }
        );
      }, [{name: 'title', value: 'Articles'}]); 
    } else {
      this.setMenuItemActive('shortsL');
      this.setMainContent('articles', function() {
        // The initialization code is lazy loaded.
        if (app.fragments.articles.initPage !== undefined)
          app.fragments.articles.initPage();
        app.loadArticlesOrShorts(
          0, 
          app.maxShorts,
          true,
          app.orderDesc ? 'desc' : 'asc',
          'articles',
          app.layoutS,
          function() {
            app.hideSpinner();
            app.bottomReached = false;
          }
        );
      }, [{name: 'title', value: 'Brèves'}]);
    }
  }
};
window.app = app;

/*
* Including the JS and polyfills
*/
//window.$ = require('jquery');
//$ = window.$;
// The min build seems to include jQuery with a NodeJS require.
// Leaving the jQuery import is not an issue though,
// Webpack won't import it twice.
// ---
// I don't know why I bother with this polyfill:
require('./polyfills/event-listeners.js');
require('materialize-css/dist/js/materialize.min.js');

/*
* Add the HTML fragments of objects on the home page
* Other fragments will be lazy loaded.
*/
app.fragments.short.template = require('./fragments/_breve.html');
app.fragments.articleCard.template = require('./fragments/_articleCard.html');
app.fragments.tag.template = require('./fragments/_tag.html');
app.fragments.menuTag.template = require('./fragments/_menuTag.html');
app.fragments.menuTagMobile.template = require('./fragments/_menuTagMobile.html');
app.fragments.home.template = require('./fragments/home.html');

/*
* Page initialization - listeners
* This could be all put in a function.
*/
// Add the spinner thingy to indicate loading, and start with it
// shown:
app.spinner = document.getElementById('spinnerCard');
app.showSpinner();  // This line is currently useless.
// Enable the stuff from Materialize (can only be done with jQuery):
$('.button-collapse').sideNav({closeOnClick: true});
$('.dropdown-button').dropdown();
app.mainEl = document.getElementById('mainEl');
app.contentEl = document.getElementById('contentEl');
// Load tags only once in here:
app.loadTags();
// We always need the fixed toolbar thingy.
// I'm using jQuery in there because it's much easier.
function pinNavbar() {
  var scrollVal = document.body.scrollTop || document.documentElement.scrollTop;
  var headerHeight = $('#navbar').height() - 64;
  if (scrollVal > headerHeight) {
    $('.categories-container').toggleClass('pinned', true);
  } else {
    $('.categories-container').toggleClass('pinned', false);
    $('.nav-background').css('opacity', (headerHeight - scrollVal) / headerHeight);
  }
}
window.addEventListener('scroll', pinNavbar);

/*
* Start routing:
*/
require('./routing.js');

console.log('App started');
