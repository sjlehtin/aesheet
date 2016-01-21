import React from 'react';
import Octicon from 'react-octicon'

class Loading extends React.Component {
    render () {
        return <div><Octicon mega spin name="sync"/> Loading...</div>;
    }
}

export default Loading;
