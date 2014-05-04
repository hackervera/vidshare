/** @jsx React.DOM */


var Youtube = React.createClass({displayName: 'Youtube',
    next: function(){
        $.get("/skip/"+this.props.cid);
    },
    render: function(){
        var url = "http://www.youtube.com/embed/"+this.props.vid+"?autoplay=1";
        //this.title(this.props.vid);
        return( 
            React.DOM.div(null, 
                React.DOM.p(null, this.props.title),
                React.DOM.iframe( {id:"ytplayer", type:"text/html", width:"640", height:"390", src:url, frameborder:"0"} ),
                React.DOM.div( {style:{"text-align": "center"}}, React.DOM.button( {onClick:this.next} , "NEXT"))
            )
        )
    }
});


var RequestForm = React.createClass({displayName: 'RequestForm',
    processForm: function(){
        console.log("prcessing form");
        var url = this.refs.songUrl.getDOMNode().value.trim()
        var self = this;
        $.post("request", {url: url}, function(response){
            self.refs.songUrl.getDOMNode().value = "";
        });
        return false;
    },
    render: function(){
        return( 
            React.DOM.form( {onSubmit:this.processForm}, 
                React.DOM.p(null, "Enter full youtube url to request song"),
                React.DOM.input( {type:"text", ref:"songUrl", size:"90"} ),
                React.DOM.input( {type:"submit"} )
            )
        )
    }
});

var Queue = React.createClass({displayName: 'Queue',
    getDefaultProps: function(){ return {songs: [] } },
    render: function(){
        return( 
            React.DOM.div(null, 
                React.DOM.p(null, "Songs currently in the queue"),
                React.DOM.ol(null, 
                this.props.songs.map(function(song){
                    return React.DOM.li(null, song.title, " " )
                })
                )
            )
        )
    }
});



var RequestModule = React.createClass({displayName: 'RequestModule',
    processForm: function(response){ console.log(response) },
    componentWillMount: function(){
        var evtSource = new EventSource("data");
        var self = this;
        evtSource.addEventListener("requests", function(e) {
            var response = JSON.parse(e.data);
            console.log(response);
            self.setState({songs: response});
        });
        evtSource.addEventListener("playing", function(e) {
            var response = JSON.parse(e.data);
            console.log("got playing");
            console.log(response);
            self.setState({playing: response});
        });
        evtSource.addEventListener("cid", function(e) {
            console.log("got cid "+e.data);
            self.setState({cid: e.data});
        });

        $.getJSON("queue", function(response){
            self.setState({songs: response});
        });
        $.getJSON("playing", function(response){
            console.log(response);
            self.setState({playing: response});
        });
    },
    getInitialState: function(){
        return {songs: [], playing: {vid: null, title: null}};
    },
    render: function(){
        return( 
            React.DOM.div(null, 
            React.DOM.div( {style:{display: "inline-block", "vertical-align": "top"}}, 
                RequestForm( {handleSubmit:this.processForm} ),
                Queue( {songs:this.state.songs})
            ),
            React.DOM.div( {style:{display: "inline-block", "margin-left": "300px"}}, 
                Youtube( {vid:this.state.playing.vid, title:this.state.playing.title, cid:this.state.cid} )
            )
            )
        )
    }
});

React.renderComponent(
  RequestModule(null ),
  document.getElementById('requests')
);



