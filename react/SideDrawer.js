import React, {useState, useEffect, useRef} from "react";
import {Offcanvas} from 'react-bootstrap'

function SideDrawer({width= 40, highlight = false, children}) {
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const toggleShow = () => setShow((s) => !s);

    const [screenWidth, setScreenWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup event listener on component unmount
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const finalX = screenWidth - width;
    const finalY = 400;
    const finalStrategy = "fixed"

    const highlightStyle = highlight? "#922" : '#333'

    const verticalHandleStyle = {
              position: finalStrategy,
              top: finalY,
              left: finalX,
              width: `${width}px`,
              writingMode: 'vertical-rl',
              textAlign: 'center',
              backgroundColor: highlightStyle,
              color: 'white',
              fontFamily: 'Arial, sans-serif',
              padding: '10px 0',
              zIndex: 2000,
              cursor: 'pointer', // Make it clear it's clickable
    };

    return <>
    {!show ? (<div style={verticalHandleStyle}
            onClick={toggleShow}
             role={"button"}
        >
            <span>Combat transients</span>
        </div>) : ''}
        <Offcanvas show={show} onHide={handleClose} scroll={true}
                   backdrop={false} placement={'end'}>
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>Combat transients</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                {children}
            </Offcanvas.Body>
        </Offcanvas>
    </>
}

export default SideDrawer
