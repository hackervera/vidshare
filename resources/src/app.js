/** @jsx React.DOM */


var Youtube = React.createClass({
    next: function(){
        $.get("/skip/"+this.props.cid);
    },
    render: function(){
        var url = "http://www.youtube.com/embed/"+this.props.vid+"?autoplay=1";
        //this.title(this.props.vid);
        return( 
            <div>
                <p>{this.props.title}</p>
                <iframe id="ytplayer" type="text/html" width="640" height="390" src={url} frameborder="0" />
                <div style={{"text-align": "center"}}><button onClick={this.next} >NEXT</button></div>
            </div>
        )
    }
});


var RequestForm = React.createClass({
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
            <form onSubmit={this.processForm}>
                <p>Enter full youtube url to request song</p>
                <input type="text" ref="songUrl" size="90" />
                <input type="submit" />
            </form>
        )
    }
});

var Queue = React.createClass({
    getDefaultProps: function(){ return {songs: [] } },
    render: function(){
        return( 
            <div>
                <p>Songs currently in the queue</p>
                <ol>
                {this.props.songs.map(function(song){
                    return <li>{song.title} </li>
                })}
                </ol>
            </div>
        )
    }
});



var RequestModule = React.createClass({
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
            <div>
            <div style={{display: "inline-block", "vertical-align": "top"}}>
                <RequestForm handleSubmit={this.processForm} />
                <Queue songs={this.state.songs}/>
            </div>
            <div style={{display: "inline-block", "margin-left": "300px"}}>
                <Youtube vid={this.state.playing.vid} title={this.state.playing.title} cid={this.state.cid} />
            </div>
            </div>
        )
    }
});

React.renderComponent(
  <RequestModule />,
  document.getElementById('requests')
);



