import { Dropdown, Space } from 'antd';

//uses antd dropdown
//returns children inside a dropdown

const CustomDropdown = ({ items, children }) => {
    return (
        <>
            <Dropdown
                menu={{
                    items,
                }}
            >
                <a onClick={(e) => e.preventDefault()}>
                    <Space>
                        {children}
                    </Space>
                </a>
            </Dropdown>
        </>
    );
}

export default CustomDropdown;