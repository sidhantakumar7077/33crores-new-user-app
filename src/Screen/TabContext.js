import React, { createContext, useContext, useState } from 'react';

const TabContext = createContext();

export const useTab = () => useContext(TabContext);

export const TabProvider = ({ children }) => {
    const [activeTab, setActiveTab] = useState('home');

    return (
        <TabContext.Provider value={{ activeTab, setActiveTab }}>
            {children}
        </TabContext.Provider>
    );
};
