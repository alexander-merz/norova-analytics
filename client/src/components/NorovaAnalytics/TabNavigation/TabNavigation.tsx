import React, { useState } from 'react';

import './TabNavigation.css';

interface TabNavigationProps {
    children: any[];
}

const TabNavigation = (props: TabNavigationProps) => {

    const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

    const handleTabClick = (e: any) => {
        setActiveTabIndex(parseInt(e.target.dataset.index));
    }

    return (
        <div className="tab-navigation">
            <section className="head">
                {props.children.map((tabContent, index) => {
                    return (
                        <div
                            key={index}
                            data-index={index}
                            className={index === activeTabIndex ? 'active' : ''}
                            onClick={handleTabClick}
                        >{tabContent.props.name}</div>
                    );
                })}
            </section>
            <section className="content">
                {props.children.map((tabContent, index) => {
                    if (index === activeTabIndex) return tabContent;
                })}
            </section>
        </div>
    )
}

export default TabNavigation;
