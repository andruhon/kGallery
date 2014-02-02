/**
 * kSlideshow
 *
 * TODO: +0.01 to add isCircular option, which should toggle repeating of gallery slideshow
 * TODO: +0.01 to add possibility of CSS class changing for control elements and title on mouseover (like hover)
 * FIXME: +0.01 escape quotes before setting alt and title attributes for picture
 *
 * @version 1.2.1 / 02.02.2014
 * @author Andrew Kondratev [andr@kopolo.ru]
 * @requires jQuery JavaScript Library > v1.3.2
 *
 * Dual licensed under MIT and GPL 2+ licenses
 * https://github.com/andruhon/kGallery
 */

function kSlideshow (new_options) {

    kSlideshowVersion = '1.2.1';

    /**
     * Default options
     * @memberOf kSlideshow
     */
    var defaults = {
            /**
             * Slideshow wrapper
             * If collection of elements given, displays the same slideshow obeying same commands in all wrappers
             * Call new kSlideshow to create independent slideshow                 *
             * var string|$.object
             */
            wrapper: '#slideshow-wrapper',

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
             * Start slideshow playback automatically
             * var boolean
             */
            autoPlay: true,

            /**
             * index of initial slide
             * var integer
             */
            startItem: 0,

            /**
             * Number of preloading pictures
             * Gallery preloads {preloadImagesCount} pictures before and after current slide
             * var integer
             */
            preloadImagesCount: 2,

            /**
             * Number of attempts before flipping to the next slide (when slideshow is playing)
             * If slide picture is not loaded yet kSlideshow prevents automatic flipping to the next slide {nextAttempts} times
             * if 0 or 1 is given, flipping automatically not waiting until picture is downloaded
             * var integer
             */
            nextAttempts: 4,

            /**
             * Interval between slides flipping, ms
             * var integer
             */
            interval: 2000,

            /**
             * Slides appearance speed, ms
             * var integer
             */
            fadeDelay: 400,

            /**
             * CSS class for slides wrappers (adds to item div)
             * var string
             */
            itemDivClass: 'kSlideshowItemDiv',

            /**
             * Create controls automatically
             * var boolean
             */
            enableControls: true,

            /**
             * Turn on displaying of titles
             * var boolean
             */
            enableTitle: true,

            /**
             * Turn on adding of alt and title attributes to slideshow images
             * var boolean
             */
            enableAlt: true,

            /**
             * Always display title block even if title is empty
             * var boolean
             */
            displayEmptyTitle: false,

            /**
             * CSS class for slideshow wrapper (adds to wrapper)
             * var string
             */
            wrapperClass: 'kSlideshowWrapper',

            /**
             * CSS class for "play/pause" toggle (adds to "play/pause" button)
             * var string
             */
            playToggleClass: 'kSlideshowPlayToggle',

            /**
             * CSS class for "play" button (adds to "play/pause" button when slideshow is on the pause)
             * var string
             */
            playClass: 'kSlideshowPlay',

            /**
             * CSS class for "pause" button (adds to "play/pause" button when slideshow is playing)
             * var string
             */
            pauseClass: 'kSlideshowPause',

            /**
             * CSS class for "next" button (adds to "next" button)
             * var string
             */
            nextClass: 'kSlideshowNext',

            /**
             * CSS class for "prev" button (adds to "prev" button)
             * var string
             */
            prevClass: 'kSlideshowPrev',

            /**
             * CSS class for title (adds to title block)
             * var string
             */
            titleClass: 'kSlideshowTitle',

            /**
             * CSS class for inactive controls buttons (adds to inactive controls)
             * var string
             */
            controlsInactiveClass: 'inactive',

            /**
             * CSS class for downloaded pictures (adds to picture when downloading of it is finished)
             * var string
             */
            loadedClass: 'loaded',

            /**
             * Function which called after initialization of a slidewhow
             * var function
             */
            afterInit: function () {},

            /**
             * Function which called before displaying of a slide (node of a slide can be not created yet if this slide displayed first time)
             * @param integer indexItem - index of current item
             * var function
             */
            beforeShow: function (itemIndex) {},

            /**
             * Middleware event between beforeShow and afterShow
             * Function which called before fadeIn animation when DOM node of slide is created already
             * @param integer indexItem - index of current item
             * @param object itemNode - DOM node of the slide
             * var function
             */
            beforeAnimation: function (itemIndex, itemNode) {},

            /**
             * Function which called when fadeIn animation of the slide is finished
             * var function
             */
            afterShow: function () {},

            /**
             * Function which called on error of parsing the data
             * See params explanations on http://api.jquery.com/jQuery.ajax/
             * var function
             */
            onLoadingError: function (jqXHR, textStatus, errorThrown){}
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
     * Array with list of items received from data (see dataSource option)
     * var array
     */
    instance.items = [];

    /**
     * jQuery object of element wrapper
     * var object
     */
    instance.wrapper;

    /**
     * Playback status
     * var boolean
     */
    instance.isPlay = false;

    /**
     * Play interval
     * var interval
     */
    instance.playInterval;

    /**
     * Index of current item
     * var integer
     */
    instance.currentItemIndex;

    /**
     * jQuery object of "previous" button
     * var object
     */
    instance.prevButton;

    /**
     * jQuery object of "play/pause" button
     * var object
     */
    instance.playToggleButton;

    /**
     * jQuery object of "next" button
     * var object
     */
    instance.nextButton;

    /* see constructor below */

    /**
     * megring of user options and default options
     * @param object new_options
     */
    function setOptions(new_options) {
        options = jQuery.extend({}, defaults, options, new_options);
    };

    /**
     * Initialization of slideshow
     */
    instance.init = function () {

        instance.wrapper = jQuery(options.wrapper);
        instance.wrapper.addClass(options.wrapperClass);

        /* playback status true - playing */
        instance.isPlay = false;

        /* Do not show control elements, do not start playback if there is just one slide */
        if (instance.items.length <= 1) {
            options.enableControls=false;
            options.autoPlay=false;
        };

        /* auto initialization of controls */
        if (options.enableControls == true) {
            instance.initControls();
        };

        /* Do not try to preload more sides than total number of slides */
        if (options.preloadImagesCount > instance.items.length) {
            options.preloadImagesCount = instance.items.length;
        };
        instance.currentItemIndex = options.startItem;

        /* add first slide, preload {options.preloadImagesCount} forward */
        instance.showItem(instance.currentItemIndex);
        instance.preloadItems(instance.currentItemIndex);

        /* start playback automatically */
        if (options.autoPlay == true) {
            instance.play();
        } else {
            /* preload previous {options.preloadImagesCount} slides if auto playback is turned off */
            if (options.enableControls == true) {
                instance.playToggleButton.addClass(options.playClass);
            };
            instance.preloadItemsPrev(instance.currentItemIndex);
        };

    };

    /**
     * Initialization of control elements
     */
    instance.initControls = function () {

        /* reset option for the case of outside method call */
        options.enableControls = true;

        /*  create buttons, attach events to buttons */
        if (!instance.prevButton) {
            instance.prevButton = jQuery('<div class="'+options.prevClass+'"></div>').appendTo(instance.wrapper);
        };
        instance.prevButton.click(function (){
            instance.prev();
        });
        if (!instance.playToggleButton) {
            instance.playToggleButton = jQuery('<div class="'+options.playToggleClass+'"></div>').appendTo(instance.wrapper);
        };
        instance.playToggleButton.click(function (){
            instance.playToggle();
        });
        if (!instance.nextButton) {
            instance.nextButton = jQuery('<div class="'+options.nextClass+'"></div>').appendTo(instance.wrapper);
        };
        instance.nextButton.click(function (){
            instance.next();
        });

    };

    /**
     * add and preload another slide
     * just adds slide node, not displaying it immediately, to display slide use {showItem()} method
     * @param integer itemIndex
     */
    instance.addItem = function (itemIndex) {
        var item = instance.items[itemIndex];

        /* preload picture file */
        var img = new Image();
        img.src = item.large;
        $(img).load(function(){
            /* set CSS class for downloaded picture */
            instance.items[itemIndex].loaded = true;
            $(instance.items[itemIndex].node).addClass(options.loadedClass);
        });

        /* preparing of title */
        var title = '';
        if (options.enableTitle==true) {
            if (item.title!=undefined) {
                title = '<div class="'+options.titleClass+'">'+item.title+'</div>';
            } else if (options.displayEmptyTitle==true) {
                title = '<div class="'+options.titleClass+'"></div>';
            }
        }

        /* strip text for alt attribute, if enableAlt option is true */
        if (options.enableAlt==true) {
            var alt = instance.stripTags(item.title);
        } else {
            var alt = '';
        }

        var newNode = jQuery('<div class="'+options.itemDivClass+'" style="display: none;"><img src="'+item.large+'" alt="'+alt+'" title="'+alt+'" class="" />'+title+'</div>').appendTo(instance.wrapper);
        instance.items[itemIndex].node = newNode;
        return newNode;
    };

    /**
     * preload {options.preloadImagesCount} forward
     * adds item only if it was not loaded earlier
     */
    instance.preloadItems = function () {
        for (var relativePreloadIndex=1; relativePreloadIndex<=options.preloadImagesCount; relativePreloadIndex++) {
            var preloadIndex = instance.currentItemIndex+relativePreloadIndex;
            if (preloadIndex >= instance.items.length) {
                preloadIndex -= instance.items.length;
            };
            if (instance.items[preloadIndex] && !instance.items[preloadIndex].node) {
                instance.addItem(preloadIndex);
            };
        };
    };

    /**
     * preload {options.preloadImagesCount} backward
     * adds item only if it was not loaded earlier
     */
    instance.preloadItemsPrev = function () {
        for (var relativePreloadIndex=1; relativePreloadIndex<=options.preloadImagesCount; relativePreloadIndex++) {
            var preloadIndex = instance.currentItemIndex-relativePreloadIndex;
            if (preloadIndex < 0) {
                preloadIndex += instance.items.length;
            };
            if (instance.items[preloadIndex] && !instance.items[preloadIndex].node) {
                instance.addItem(preloadIndex);
            };
        };
    };

    /**
     * Start(restart) playback
     */
    instance.play = function () {
        clearInterval(instance.playInterval); /* clear interval, in case of calling method for slideshow which is already playing */
        instance.playInterval = setInterval(function (){
            instance.next(true,true);
        },options.interval);
        instance.isPlay = true;
        /* if automatic control elements is enabled - change their CSS classes */
        if (options.enableControls == true) {
            instance.playToggleButton.addClass(options.pauseClass);
            instance.playToggleButton.removeClass(options.playClass);
        };
    };

    /**
     * Toggle playback (play/stop)
     * @returns string - text status of playback play|stop
     */
    instance.playToggle = function () {
        if (instance.isPlay == false) {
            instance.play();
            return 'play';
        } else if (instance.isPlay == true) {
            instance.stop();
            return 'stop';
        } else {
            alert ('Error: wrong play status in .playToggle()');
        };
    };

    /**
     * Stop playback
     */
    instance.stop = function () {
        clearInterval(instance.playInterval);
        instance.isPlay = false;
        /* if automatic control elements is enabled - change their CSS classes */
        if (options.enableControls == true) {
            instance.playToggleButton.addClass(options.playClass);
            instance.playToggleButton.removeClass(options.pauseClass);
        };
        /* try to preload backward, just in case */
        instance.preloadItemsPrev(instance.currentItemIndex);
    };

    /**
     * flip to next slide
     * @param boolean checkIfLoaded - prevent flipping to the next slide, which is still not loaded, {options.nextAttempts} times if TRUE
     * @param boolean doNotClearPlaybackInterval - do not clear playback interval
     */
    instance.next = function (checkIfLoaded,doNotClearPlaybackInterval) {
        /* reset index if it is the last slide */
        var nextItemIndex = instance.currentItemIndex+1;
        if (nextItemIndex >= instance.items.length) {
            nextItemIndex = 0;
        };

        if (checkIfLoaded==true && instance.items[instance.currentItemIndex].nextAttempts==undefined) {
            instance.items[instance.currentItemIndex].nextAttempts = 1;
        }

        /* if {checkIfLoaded} TRUE, display slide only if picture is already downloaded */
        if (checkIfLoaded!=true || instance.items[instance.currentItemIndex].nextAttempts>options.nextAttempts || (checkIfLoaded==true && instance.items[instance.currentItemIndex].loaded == true)) {
            /* show next slide */
            instance.showItem(nextItemIndex, true, doNotClearPlaybackInterval);

            /* preload next slides */
            instance.preloadItems(instance.currentItemIndex);
        } else {
            instance.items[instance.currentItemIndex].nextAttempts++;
        }
    };

    /**
     * flip to the previous slide
     */
    instance.prev = function () {
        /* reset index if it is first slide (last in the reverse direction) */
        var prevItemIndex = instance.currentItemIndex-1;
        if (prevItemIndex < 0) {
            prevItemIndex = instance.items.length-1;
        };

        /* show next slide */
        instance.showItem(prevItemIndex, true);

        /* preload previous slides */
        instance.preloadItemsPrev(instance.currentItemIndex);
    };

    /**
     * Display slide by item
     * @param integer itemIndex - index of slide
     * @param boolean preloadSiblings - if FALSE, do not preload next and previous slides
     * @param boolean doNotClearPlaybackInterval - do not clear playback interval
     * @return boolean - false if there is no slide with this index
     */
    instance.showItem = function (itemIndex,preloadSiblings,doNotClearPlaybackInterval) {
        /* before show event */
        options.beforeShow(itemIndex);

        /* Is there such picture in the list? */
        if (instance.items[itemIndex]) {
            /* reset playback interval to avoid flipping of just displayed slide, when switching slide manually */
            if (doNotClearPlaybackInterval!=true && instance.isPlay==true){
                instance.play();
            }
            /* hide current slide */
            if (instance.items[instance.currentItemIndex] && instance.items[instance.currentItemIndex].node) {
                instance.items[instance.currentItemIndex].node.css('position','absolute');
                instance.items[instance.currentItemIndex].node.fadeOut(options.fadeDelay);
            };
            instance.currentItemIndex = itemIndex;
            if (instance.items[instance.currentItemIndex]) {
                if (!instance.items[instance.currentItemIndex].node) {
                    /* preload this slide if needed */
                    instance.addItem(instance.currentItemIndex);
                };
                /* event after picture initialization before fadeIn animation */
                options.beforeAnimation(itemIndex,instance.items[instance.currentItemIndex].node);
                /* fadeIn picture */
                instance.items[instance.currentItemIndex].node.css('position','relative');
                instance.items[instance.currentItemIndex].node.fadeIn(options.fadeDelay,options.afterShow());
            };
            /* Preload next and previous pictures */
            if (preloadSiblings == true) {
                instance.preloadItems(instance.currentItemIndex);
                instance.preloadItemsPrev(instance.currentItemIndex);
            };
            return true;
        } else {
            /* there is nos slide with such index */
            return false;
        };
    };

    /**
     * Destroy this instance
     */
    instance.destroy = function() {
        instance.stop();
        instance.wrapper.remove();
        /* deleting all item references */
        for (var itemIndex=0; itemIndex<instance.items.length; itemIndex++) {
            var item = instance.items[itemIndex];
            delete item.node;
        }
    };

    /**
     * remove all tags and replace all quotes
     * @param string
     * @return string
     */
    instance.stripTags = function(string){
        if (string != undefined && string != '') {
            string = string.replace(/<\/?[^>]+>/gi, '');
            return string.replace(/"/gi, "''");
        } else {
            return '';
        }
    };

    /**
     * Get slide from outside of class
     * @return options
     */
    instance.getOptions = function()
    {
        return options;
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
         * recieveng the data for slideshow
         */
        if (options.dataSource != false) {
            if (options.dataType=='array') {
                instance.items = options.dataSource;
                instance.init ();
                options.afterInit();
            } else {
                jQuery.ajax({
                    url: options.dataSource,
                    success: function (data) {
                        var items = data.items;
                        if (items.length > 0) {
                            instance.items = items;
                            instance.init ();
                            options.afterInit();
                        };
                    },error: function (jqXHR, textStatus, errorThrown) {options.onLoadingError(jqXHR, textStatus, errorThrown);},
                    dataType: options.dataType
                });
            }
        };
    };

    return instance;
};