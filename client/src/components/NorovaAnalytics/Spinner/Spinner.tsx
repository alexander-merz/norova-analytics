import React, { useEffect } from 'react';
import NorovaLogo from '../images/Norova-Logo.png';
import './Spinner.css';

const Spinner = () => {
    useEffect(() => {
        document.body.style.pointerEvents = 'none';
        return () => {
            document.body.style.pointerEvents = 'auto';
        }
    }, []);
    return (
        <div className="logo-container">
            <img id="norova-logo" src={NorovaLogo} alt="Norova Logo" />
        </div>
    );
}

export default Spinner;
