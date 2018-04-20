// Wrapper for SVGBar
(function() {
    
    // Define our constructor
    SVGBar = function() {

        // Global, public flags 
        this.is_pathline_visible = false;   // Flag for display of dashed centreline    
        this.is_animating = false;          // Flag for whether currently animating

        var curr_path;

        // Define option defaults
        var defaults = {
            svg: document.getElementsByTagName('svg')[0],
            anim_length: 5000
        }
        
        // Create options by extending defaults with the passed in arugments
        if (arguments[0] && typeof arguments[0] === "object") {
            this.options = extendDefaults(defaults, arguments[0]);
        }else{
            this.options = defaults;
        }

        // Populate mask and path parameters if they were not passed in
        // We do this so that we use the svg option, in case that was passed in too
        if(!this.options.paths){
            this.options.paths = this.options.svg.getElementsByClassName('progress_path');
        }
        if(!this.options.mask){
            this.options.mask = this.options.svg.getElementsByClassName('mask')[0];
        }

        this.setPath = function(path_to_set){
            curr_path = path_to_set;
            return this;
        }
        this.getPath = function(){
            return curr_path;
        }

        // Set the initial path reference
        this.setPath(this.options.paths[0]);

        // Do stuff!
        init_bars(this.options.paths, this.options.mask);
        
    }

    // Public Methods
    SVGBar.prototype.resetBars = function(){
        [].forEach.call(this.options.paths, function (path) {
            path.style.strokeDashoffset = path.getTotalLength();
            path.style.animation = 'none';

            var path = document.querySelector('#'+path.getAttribute('id')+"_path_line");
            path.style.opacity = 0;
        });
        this.displayPathLine(this.is_pathline_visible);
        this.setAnimationState(this.is_animating);
    }

    // Starts or stops the animation of the rev bar
    SVGBar.prototype.setAnimationState = function(will_play){
        this.is_animating = will_play;
        if(!will_play){
            this.getPath().style.animation = 'none';
        }else{
            this.getPath().style.animation = this.getPath().getAttribute('data-anim-name') + ' ' + this.options.anim_length+'ms linear alternate infinite';
        }
        return this.is_animating;
    }

    // Toggle between playing and paused animation
    SVGBar.prototype.toggleAnimationState = function(){
        return this.setAnimationState(!this.is_animating); 
    }
       
    // Shows or hides the centreline for the current path
    SVGBar.prototype.displayPathLine = function(will_show){
        var path = document.querySelector('#'+this.curr_path.getAttribute('id')+"_path_line");
        this.is_pathline_visible = will_show;
        if(!will_show){
            $(".toggle").removeClass("selected");
            path.style.opacity = 0;
        }else{
            $(".toggle").addClass("selected");
            path.style.opacity = 1;
        }
    }

    // Toggle visible state of the path line
    SVGBar.prototype.togglePathLine = function(){
        this.displayPathLine(!this.is_pathline_visible);
    }

    
    // Sets the percentage fill of a rev bar, used for tying to mouse movement
    SVGBar.prototype.setProgress = function(percent){
        var length = this.getPath().getTotalLength();
        this.getPath().style.strokeDashoffset = length - (length*percent);
    }

    // Utility method to extend defaults with user options
    function extendDefaults(source, properties) {
        var property;
        for (property in properties){
            if (properties.hasOwnProperty(property)){
                source[property] = properties[property];
            }
        }
        return source;
    }

    // Clone and create SVG objects required for masking and path line displays
    function init_bars(paths, mask){
        
        var svgNs = 'http://www.w3.org/2000/svg';

        var svg_obj = document.querySelector('#svg_anim');

        var defs;
        if(svg_obj.getElementsByTagName('defs').length > 0){
            defs = svg_obj.getElementsByTagName('defs')[0];
        }else{
            defs = document.createElementNS(svgNs, 'defs');
            svg_obj.appendChild(defs);
        }

        var clippath_name = "mask-" + Date.now().toString().slice(-8);

        var clippath = document.createElementNS(svgNs, 'clipPath'); // Needs createElementNS as per https://gist.github.com/ufologist/be47161b2f960f941259
        clippath.setAttribute('id',clippath_name);
        defs.appendChild(clippath);

        var new_mask = mask.cloneNode(true);
        clippath.appendChild(new_mask);

        var count = 0;
        [].forEach.call(paths, function (path) {

            // Create names for the animation and pathline
            var path_line_name = "path-line-" + Date.now().toString().slice(-8) + count;
            var anim_name = "anim-" + Date.now().toString().slice(-8) + count;
 
            // Calculate total length of this path
            var length = path.getTotalLength();

            // Clone to create a path line for displaying if necessary
            var path_line = path.cloneNode(true);
            path_line.setAttribute('id', path_line_name)
            path_line.removeAttribute('class');
            path_line.classList.add('path_line');
            svg_obj.appendChild(path_line);

            // Set clipping mask for the path
            path.style.clipPath = 'url(#'+clippath_name+'')';

            // Set up the starting positions
            path.style.strokeDasharray = length + ' ' + length;
            path.style.strokeDashoffset = length;

            // Save names of animation and path_line for future reference
            path.setAttribute('data-anim-name',anim_name);
            path.setAttribute('data-path_line-name',path_line_name);

            // Create the keyframe animation based upon the animation length
            var style = document.createElement('style');
            style.type = 'text/css';
            var keyFrames = '\
            @keyframes '+anim_name+' {\
                0% {\
                    stroke-dashoffset: PATH_LENGTH;\
                }\
                100% {\
                    stroke-dashoffset: 0;\
                }\
            }';
            style.innerHTML = keyFrames.replace(/PATH_LENGTH/g, length);
            document.getElementsByTagName('head')[0].appendChild(style);

            count++;    // Increment counter to keep names unique
        });
    }

}());