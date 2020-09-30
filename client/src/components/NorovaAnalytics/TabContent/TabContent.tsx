import React from 'react';

interface TabContentProps {
    name: string;
    children: any;
}

const TabContent = (props: TabContentProps) => props.children;

export default TabContent;
