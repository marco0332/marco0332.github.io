(function() {
  var SOURCES = window.TEXT_VARIABLES.sources;
  function queryString() {
    // This function is anonymous, is executed immediately and
    // the return value is assigned to QueryString!
    var i = 0, queryObj = {}, pair;
    var queryStr = window.location.search.substring(1);
    var queryArr = queryStr.split('&');
    for (i = 0; i < queryArr.length; i++) {
      pair = queryArr[i].split('=');
      // If first entry with this name
      if (typeof queryObj[pair[0]] === 'undefined') {
        queryObj[pair[0]] = pair[1];
        // If second entry with this name
      } else if (typeof queryObj[pair[0]] === 'string') {
        queryObj[pair[0]] = [queryObj[pair[0]], pair[1]];
        // If third or later entry with this name
      } else {
        queryObj[pair[0]].push(pair[1]);
      }
    }
    return queryObj;
  }

  var setUrlQuery = (function() {
    var baseUrl =  window.location.href.split('?')[0];
    return function(query) {
      if (typeof query === 'string') {
        window.history.replaceState(null, '', baseUrl + query);
      } else {
        window.history.replaceState(null, '', baseUrl);
      }
    };
  })();

  window.Lazyload.js(SOURCES.jquery, function() {
    var $tags = $('.js-tags');
    var $rawTags = $tags.find('button');
    var $tagShowAll = $tags.find('.tag-button--all');
    var $result = $('.js-result');
    var $sections = $result.find('section');
    var $categoryArticles = $result.find('article');
    var sectionArticles = [];
    var $articleTags = null;
    var $lastFocusButton = null;
    var sectionTopArticleIndex = [];
    var hasInit = false;

    $sections.each(function() {
      sectionArticles.push($(this).find('.item'));
    });

    function init() {
      var i, index = 0;
      for (i = 0; i < $sections.length; i++) {
        sectionTopArticleIndex.push(index);
        index += $sections.eq(i).find('.item').length;
      }
      sectionTopArticleIndex.push(index);
    }

    function initTags(category) {
      $categoryArticles = $categoryArticles.filter((_, article) => {
        return $(article).data('tags').split(',').includes(category);
      });

      $articleTags = $rawTags.filter((_, tagButton) => {
        var flag = $(tagButton).data('encode') !== category;
        if(!flag){
          $(tagButton).attr('style', 'color: rgba(0, 0, 0, 0.3)!important; background-color: #fff!important')
          $(tagButton).attr('disabled', true)
        }
        return flag;
      });
    }

    function searchButtonsByTag(_tag/*raw tag*/) {
      if (!_tag) {
        return $tagShowAll;
      }
      var _buttons = $articleTags.filter('[data-encode="' + _tag + '"]');
      if (_buttons.length === 0) {
        return $tagShowAll;
      }
      return _buttons;
    }
    function buttonFocus(target) {
      if (target) {
        target.addClass('focus');
        $lastFocusButton && !$lastFocusButton.is(target) && $lastFocusButton.removeClass('focus');
        $lastFocusButton = target;
      }
    }

    function tagSelectWithCategory (tag, category, result) {
      var i = 0;
      for (j = 0; j < $categoryArticles.length; j++) {
        var tags = $categoryArticles.eq(j).data('tags')?.split(',') || [];
        if (tag !== '' && tag !== undefined) {
          var category_flag = false;
          for (k = 0; k < tags.length; k++) {
            if (tags[k] === category) {
              category_flag = true; break;
            }
          }

          if (category_flag) {
            for (k = 0; k < tags.length; k++) {
              if (tags[k] === tag) {
                result[i] || (result[i] = {});
                result[i][j] = true; break;
              }
            }
          }
        } else {
          for (k = 0; k < tags.length; k++) {
            if (tags[k] === category) {
              result[i] || (result[i] = {});
              result[i][j] = true; break;
            };
          }
        }
      }
      
      result[i] && $sections.eq(i).removeClass('d-none');
      result[i] || $sections.eq(i).addClass('d-none');
      for (j = 0; j < $categoryArticles.length; j++) {
        if (result[i] && result[i][j]) {
          $categoryArticles.eq(j).removeClass('d-none');
        } else {
          $categoryArticles.eq(j).addClass('d-none');
        }
      }

      hasInit || ($result.removeClass('d-none'), hasInit = true);
    }

    function tagSelect (tag/*raw tag*/, category/*raw category*/, target) {
      var result = {}, $articles;
      var i, j, k, _tag, _category;

      if(category !== '' && category !== undefined) {
        tagSelectWithCategory(tag, category, result);
      } else {
        for (i = 0; i < sectionArticles.length; i++) {
          $articles = sectionArticles[i];
          for (j = 0; j < $articles.length; j++) {
            if (tag === '' || tag === undefined) {
              result[i] || (result[i] = {});
              result[i][j] = true;
            } else {
              var tags = $articles.eq(j).data('tags')?.split(',');
              for (k = 0; k < tags.length; k++) {
                if (tags[k] === tag) {
                  result[i] || (result[i] = {});
                  result[i][j] = true; break;
                }
              }
            }
          }
        }

        for (i = 0; i < sectionArticles.length; i++) {
          result[i] && $sections.eq(i).removeClass('d-none');
          result[i] || $sections.eq(i).addClass('d-none');
          for (j = 0; j < sectionArticles[i].length; j++) {
            if (result[i] && result[i][j]) {
              sectionArticles[i].eq(j).removeClass('d-none');
            } else {
              sectionArticles[i].eq(j).addClass('d-none');
            }
          }
        }

        hasInit || ($result.removeClass('d-none'), hasInit = true);
      }

      if (target) {
        buttonFocus(target);
        _tag = target.attr('data-encode');
        _category = target.attr('data-category');
        if (_category === '' || _category === undefined) {
          if (_tag === '' || typeof _tag !== 'string') {
            setUrlQuery();
          } else {
            setUrlQuery('?tag=' + _tag);
          }
        } else if (_tag !== '' && typeof _tag === 'string') {
          setUrlQuery('?category=' + _category + '&tag=' + _tag);
        } else {
          setUrlQuery('?category=' + _category);
        }
      } else {
        buttonFocus(searchButtonsByTag(tag));
      }
    }

    var query = queryString(), _tag = query.tag; _category = query.category;
    init(); initTags(_category); tagSelect(_tag, _category);
    $tags.on('click', 'button', function() {
      tagSelect($(this).data('encode'), $(this).data('category'), $(this));
    });
  });
})();
