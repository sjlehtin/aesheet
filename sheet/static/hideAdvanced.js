(function( $ ) {
    $.widget( "sheet.hideAdvanced", {
	options: {
	    showAdvancedText: 'Show advanced',
	    startOpen: false
	},

	toggle: function () {
	    var should_hide = this.element.is(':visible');
	    var button_text = 'Hide';
	    if (should_hide) {
		button_text = this.options.showAdvancedText;
	    }
	    this._button.button('option', 'text', button_text);
	    this.element.toggle(!should_hide);
	},

	_create: function() {
	    var that = this;
	    this._button = $('<button input="button" ' +
			     'class="show-hide-advanced">' + 
			     this.options.showAdvancedText + 
			     '</button>').button();
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
