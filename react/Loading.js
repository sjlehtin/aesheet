import React from 'react';
import Octicon from 'react-octicon'

class Loading extends React.Component {
    render () {
        var content;
        if (this.props.children) {
            content = this.props.children;
        } else {
            content = 'Loading...';
        }
        return <div><Octicon id={"loading"} mega spin name="sync"/>{content}</div>;
    }
}

export default Loading;
