/**
 * kThumbnailPicker
 *
 * TODO: +0.0.1 to add isCircular option, which should toggle repeating of gallery slideshow
 * FIXME: +0.0.1 empty page is displayed when clicking on one direction and immediately clicking in other direction until animation performs
 *
 * @version 1.1.1 / 02.02.2014
 * @author Andrew Kondratev [andr@kopolo.ru]
 * @requires jQuery JavaScript Library > v1.3.2
 *
 * Dual licensed under MIT and GPL 2+ licenses
 * https://github.com/andruhon/kGallery
 */

function kThumbnailPicker (new_options) {

    kThumbnailPickerVersion = '1.1.1';

    /**
     * Default options
     * @memberOf kThumbnailPicker
     */
    var defaults = {
            /**
             * thumbnails wrappers
             * var string|$.object
             */
            wrapper: '#thumbnails-wrapper',

            /**
             * Url with the data for gallery (JSON usually) or JavaScript array (should replace dataType to array)
             * see jQuery.ajax()
             * var string | array
             */
            dataSource: 'data.json',

            /**
             * Url with the data for gallery (JSON usually)
             * @deprecated use dataSouce instead
             * see jQuery.ajax()
             * var string
             */
            url: undefined,

            /**
             * Data type
             * see jQuery.ajax() + 'array' option
             * var string
             */
            dataType: 'json',

            /**
             * Vertical scrolling
             * var boolean
             */
            vertical: false,

            /**
             * Number of previews on page
             * Do not forget to set correct size for the wrapper and the innerWrapper, considering the width, height and number of items on page
             * var integer
             */
            itemsOnPage: 3,

            /**
             * Number of preloading pages
             * Only thumbnails for next(and previous) {preloadPagesCount} pages are downloading,
             * When you switching to the next page - thumbnails of next+{preloadPagesCount} page are downloading (if them are not downloaded yet)
             * var integer
             */
            preloadPagesCount: 2,

            /**
             * index of initial slide
             * Index of initial page will be calculated automatically
             * var integer
             */
            startItem: 0,

            /**
             * CSS class, which adds to the thumbnails wrapper
             * var string
             */
            wrapperClass: 'kThumbnailsWrapper',

            /**
             * CSS class, which adds to the thumbnails inner wrapper
             * var string
             */
            innerWrapperClass: 'kThumbnailsInnerWrapper',

            /**
             * CSS class, which adds to next page button
             * var string
             */
            nextPageClass: 'kThumbnailsNextPage',

            /**
             * CSS class, which adds to previous page button
             * var string
             */
            prevPageClass: 'kThumbnailsPrevPage',

            /**
             * CSS class, which adds to inactive control elements
             * var string
             */
            controlsInactiveClass: 'inactive',

            /**
             * CSS class, which adds to all thumbnails pages
             * var string
             */
            pageClass: 'kThumbnailsPage',

            /**
             * Enable auto creation of control elements for thumbnails
             * var boolean
             */
            enableControls: true,

            /**
             * animation effect for pages scrolling
             * 'slide'||'fade'
             * var string
             */
            scrollingEffect: 'slide',

            /**
             * speed of scrolling, milliseconds
             * var int
             */
            scrollingSpeed: 1000,

            /**
             * Function, which calls after initialization of thumbnails
             * var function
             */
            afterInit: function () {},

            /**
             * Function, which calls before changing of page
             * @param boolean nextOrPrev - true is passed if showPage called by instance.next or instance.prev methods
             * var function
             */
            beforeShow: function (nextOrPrev) {},

            /**
             * Function, which calls after changing of page
             * @param boolean nextOrPrev - true is passed if showPage called by instance.next or instance.prev methods
             * var function
             */
            afterShow: function (nextOrPrev) {},

            /**
             * Function, which calls on thumbnail click
             * @param integer itemIndex - index of clicked thumbnail
             * var function
             */
            thumbnailClick: function (itemIndex) {}


    };

    /**
     * Link to itself, available anywhere inside class
     * It can be used like class::this operator even inside of asynchronous methods, which has their own this
     * var object
     */
    var instance = {};

    /**
     * Result of megring of user options and default options, available anywhere inside the class
     * var object
     */
    var options;

    /**
     * Array with list of thumbnail items received from data (see dataSource option)
     * var array
     */
    instance.items = [];

    /**
     * index of current page
     * var integer
     */
    instance.currentPageIndex;

    /**
     * Number of thumbnails
     * calculated on initialization
     * var int
     */
    instance.itemsCount;

    /**
     * Calculated number of pages
     * var int
     */
    instance.pagesCount;

    /**
     * Array with pages
     * var array
     */
    instance.pages = [];

    /**
     * jQuery object of "previous page" button
     * var object
     */
    instance.prevPageButton;

    /**
     * jQuery object of "next page" button
     * var object
     */
    instance.nextPageButton;

    /**
     * jQuery object of wrapper
     * var object
     */
    instance.wrapper;

    /**
     * jQuery object of inner wrapper
     * var object
     */
    instance.innerWrapper;

    /* see constructor below */

    /**
     * megring of user options and default options
     * @param object new_options
     */
    function setOptions(new_options) {
        options = jQuery.extend({}, defaults, options, new_options);
    };

    /**
     * Initialization of thumbnails
     */
    instance.init = function () {

        instance.wrapper = jQuery(options.wrapper);
        instance.wrapper.addClass(options.wrapperClass);

        /* creating of inner wrapper for thumbnails */
        instance.innerWrapper = jQuery('<div class="'+options.innerWrapperClass+'"></div>').appendTo(instance.wrapper);

        /* calculating of previews and pages numbers */
        instance.itemsCount = instance.items.length;
        instance.pagesCount = Math.ceil(instance.itemsCount/options.itemsOnPage);

        /* do not initialize controls if there is only one page */
        if (instance.pagesCount <= 1) {
            options.enableControls = false;
        };

        /* do not try to preload more pages than available */
        if (options.preloadPagesCount > instance.pagesCount) {
            options.preloadPagesCount = instance.pagesCount;
        };

        /* autocreating of control elements */
        if (options.enableControls == true) {
            instance.initControls();
        };

        /* display current (1?) page */
        instance.showItem(options.startItem);
        instance.preloadPages(instance.currentPageIndex);
    };

    /**
     * initialize control elements
     */
    instance.initControls = function () {
        instance.prevPageButton = jQuery('<div class="'+options.prevPageClass+'"></div>').appendTo(instance.wrapper);
        instance.prevPageButton.click(function(){
            instance.prev();
        });
        instance.nextPageButton = jQuery('<div class="'+options.nextPageClass+'"></div>').appendTo(instance.wrapper);
        instance.nextPageButton.click(function(){
            instance.next();
        });
    };

    /**
     * calculating page index by itemIndex
     * @param int itemIndex
     * @return int pageIndex
     */
    instance.getPageIndex = function (itemIndex) {
        /* first page has index = 0 */
        pageIndex = Math.ceil((itemIndex+1)/options.itemsOnPage)-1;
        return pageIndex;
    };

    /**
     * preload of one page by index
     * @param int pageIndex
     */
    instance.preloadPage = function (pageIndex) {
        if (!instance.pages[pageIndex]) {
            /* this page is not preloaded yet */
            instance.pages[pageIndex] = jQuery('<div class="'+options.pageClass+'" style="display: none;"></div>').appendTo(instance.innerWrapper);
            var firstIndexOnPage = pageIndex*options.itemsOnPage;
            var lastIndexOnPage = firstIndexOnPage + options.itemsOnPage;
            for (var itemIndex = firstIndexOnPage;itemIndex < lastIndexOnPage;itemIndex++) {
                if (instance.items[itemIndex]) {
                    /* preload each thumbnail on the page */
                    var item = jQuery('<img/>').attr('src',instance.items[itemIndex].thumb);
                    item.appendTo(instance.pages[pageIndex]);
                    instance.items[itemIndex].thumbnailNode = item;
                    item.bind('click', {itemIndex: itemIndex}, function(event){
                        options.thumbnailClick(event.data.itemIndex);
                    });
                };
            };
        };
    };

    /**
     * preloading of {options.preloadPagesCount} pages ahead
     * @param int pageIndex
     */
    instance.preloadPages = function (pageIndex) {
        for (var relativePreloadIndex=1; relativePreloadIndex<=options.preloadPagesCount; relativePreloadIndex++) {
            var preloadIndex = instance.currentPageIndex+relativePreloadIndex;
            if (preloadIndex >= instance.pagesCount) {
                preloadIndex -= instance.pagesCount;
            };
            if (!instance.pages[preloadIndex]) {
                instance.preloadPage(preloadIndex);
            };
        };
    };

    /**
     * preloading of {options.preloadPagesCount} pages back
     * @param int pageIndex
     */
    instance.preloadPagesPrev = function (pageIndex) {
        for (var relativePreloadIndex=1; relativePreloadIndex<=options.preloadPagesCount; relativePreloadIndex++) {
            var preloadIndex = instance.currentPageIndex-relativePreloadIndex;
            if (preloadIndex < 0) {
                preloadIndex += instance.pagesCount;
            };
            if (!instance.pages[preloadIndex]) {
                instance.preloadPage(preloadIndex);
            };
        };
    };

    /**
     * shows page by index
     * @param int pageIndex
     * @param boolean nextOrPrev - true is passed if showPage called by instance.next or instance.prev methods
     */
    instance.showPage = function (pageIndex,nextOrPrev) {
        /* event before show of page */
        options.beforeShow(nextOrPrev);
        /*  If such page may exist */
        if (pageIndex >= 0 && pageIndex < instance.pagesCount && pageIndex != instance.currentPageIndex) {

            /* preloading of page if it not preloaded yet */
            if (!instance.pages[pageIndex]) {
                instance.preloadPage(pageIndex);
            };

            /* get appearance parameters */
            var scrollingEffect = instance.getScrollingEffect(pageIndex);

            var currentPageIndex = instance.currentPageIndex;

            /* hide current page if it exists*/
            if (instance.pages[currentPageIndex]) {
                instance.pages[currentPageIndex].animate(scrollingEffect.fadeOutEffect, options.scrollingSpeed);
            };

            instance.currentPageIndex = pageIndex;

            /* show next page */
            instance.pages[pageIndex].css(scrollingEffect.hiddenMap);
            instance.pages[pageIndex].animate(scrollingEffect.fadeInEffect, options.scrollingSpeed, options.afterShow(nextOrPrev));

            /* change control elements if necessary */
            if (options.enableControls==true) {
                if (instance.currentPageIndex == 0) {
                    /* back button is not active, when first page is selected */
                    instance.prevPageButton.addClass(options.controlsInactiveClass);
                    instance.nextPageButton.removeClass(options.controlsInactiveClass);
                } else if (instance.currentPageIndex >= instance.pagesCount-1) {
                    /* next button is not active, when last page is selected */
                    instance.nextPageButton.addClass(options.controlsInactiveClass);
                    instance.prevPageButton.removeClass(options.controlsInactiveClass);
                } else {
                    /* not first and not last page - remove inacitve classes */
                    instance.nextPageButton.removeClass(options.controlsInactiveClass);
                    instance.prevPageButton.removeClass(options.controlsInactiveClass);
                };
            };
        }
    };

    /**
     * Appearance parameters for changing thumbnails pages
     * Parameters is not in options object because their peculiarity
     * so we are using just 'slide' and 'fade'
     * @param int pageIndex
     */
    instance.getScrollingEffect = function (pageIndex) {
        /* appearance effects fo changing pages */
        var scrollingEffect = {};
        switch (options.scrollingEffect) {
            /* slidnig effect */
            case 'slide':
                if (pageIndex == instance.currentPageIndex+1) {
                    /* next page */
                    if (options.vertical == false) {
                        /* horisontal scrolling */
                        scrollingEffect.fadeOutEffect = {left: '-100%'};
                        scrollingEffect.fadeInEffect = {left: '0%', opacity: '1'};
                        scrollingEffect.hiddenMap = {left: '100%', display: 'block'};
                    } else {
                        /* vertical scrolling */
                        scrollingEffect.fadeOutEffect = {top: '-100%'};
                        scrollingEffect.fadeInEffect = {top: '0%', opacity: '1'};
                        scrollingEffect.hiddenMap = {top: '100%', display: 'block'};
                    }
                } else if (pageIndex == instance.currentPageIndex-1) {
                    /* previous page */
                    if (options.vertical == false) {
                        /* horisontal scrolling */
                        scrollingEffect.fadeOutEffect = {left: '100%'};
                        scrollingEffect.fadeInEffect = {left: '0%', opacity: '1'};
                        scrollingEffect.hiddenMap = {left: '-100%', display: 'block'};
                    } else {
                        /* vertical scrolling */
                        scrollingEffect.fadeOutEffect = {top: '100%'};
                        scrollingEffect.fadeInEffect = {top: '0%', opacity: '1'};
                        scrollingEffect.hiddenMap = {top: '-100%', display: 'block'};
                    }
                } else {
                    /* all other pages just fading in */
                    scrollingEffect.fadeOutEffect = {opacity: '0'};
                    scrollingEffect.fadeInEffect = {opacity: '1', left: '0%', top: '0%'};
                    scrollingEffect.hiddenMap = {opacity: '0', left: '0%', top: '0%', display: 'block'};
                };
                break;
            /* fading effect */
            case 'fade':
                scrollingEffect.fadeOutEffect = {opacity: '0'};
                scrollingEffect.fadeInEffect = {opacity: '1'};
                scrollingEffect.hiddenMap = {opacity: '0', display: 'block'};
                break;
            default:
                /* unrecognized effect - use the 'slide' effect */
                options.scrollingEffect = 'slide';
                scrollingEffect = instance.getScrollingEffect(pageIndex);
        };
        return scrollingEffect;
    };

    /**
     * showing page by item (preview) index
     * @param integer itemIndex
     */
    instance.showItem = function (itemIndex) {
        var pageIndex = instance.getPageIndex(itemIndex);
        instance.showPage(pageIndex);
    };

    /**
     * scrolling to the next page
     */
    instance.next = function () {
        /* if it is inside of pages range */
        if (instance.currentPageIndex+1 < instance.pagesCount) {
            var nextPageIndex = instance.currentPageIndex+1;

            instance.showPage(nextPageIndex,true);

            /* preload images on next pages */
            instance.preloadPages(instance.currentPageIndex);
        };
    };

    /**
     * scrolling to the previous page
     */
    instance.prev = function () {
        /* if it is inside of pages range */
        if (instance.currentPageIndex-1 >= 0) {
            var prevPageIndex = instance.currentPageIndex-1;

            instance.showPage(prevPageIndex,true);

            /* preload images on previous pages */
            instance.preloadPagesPrev(instance.currentPageIndex);
        };
    };

    /**
     * Destroy this instance
     */
    instance.destroy = function() {
        instance.wrapper.remove();
    };

    /**
     * "Constructor"
     */
    {
        if (new_options.url) {
            /* compatiblity feature */
            new_options.dataSource = new_options.url;
        }

        setOptions(new_options);
        /*
         * Receiving data for thumbnails
         */
        if (options.dataSource != false) {
            if (options.dataType=='array') {
                instance.items = options.dataSource;
                instance.init();
                options.afterInit();
            } else {
                jQuery.ajax({
                    url: options.dataSource,
                    success: function (data) {
                        var items = data.items;
                        if (items.length > 0) {
                            instance.items = items;
                            instance.init();
                            options.afterInit();
                        };
                    },
                    dataType: options.dataType
                });
            }
        };
    };

    return instance;
};