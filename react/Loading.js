import React from 'react';
import {GoSync} from 'react-icons/go'

class Loading extends React.Component {
    render () {
        var content;
        if (this.props.children) {
            content = this.props.children;
        } else {
            content = 'Loading...';
        }
        return <div><GoSync id={"loading"} mega spin />{content}</div>;
    }
}

export default Loading;
