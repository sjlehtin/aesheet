(function( $ ) {
    $.widget( "sheet.hideAdvanced", {
	options: {
	    showAdvancedText: 'Show advanced',
	    startOpen: false,
        style: "button" // plain or button.
	},

	toggle: function () {
	    var should_hide = this.element.is(':visible');
	    var button_text = 'Hide';
	    if (should_hide) {
            button_text = this.options.showAdvancedText;
	    }
        if (this.options.style === 'button') {
            this._button.button('option', 'label', button_text);
        } else {
            this._button.text(button_text);
        }
	    this.element.toggle(!should_hide);
	},

	_create: function() {
	    var that = this;
        var advanced_text = this.element.data('advanced-text');
        if (advanced_text) {
            this.options.showAdvancedText = advanced_text;
        }
        this._button = $('<a href="javascript:void(0)"' +
			     'class="show-hide-advanced">' + 
			     this.options.showAdvancedText +
			     '</a>');

        if (this.options.style === "button") {
            this._button.button();
        }

        this._button.click(function () {
            that.toggle();
        });

	    this.element.before(this._button);
        this.toggle();
	    if (this.options.startOpen) {
            this.toggle();
	    }
	}
    });
})( jQuery );
