interface DataItem {
    id: number | string;
    name: string;
    value: string;
    parentId?: number | string | '';
}

interface Node {
    value: string;
    children: Record<string, any>;
}

export function convertArrayToObject(data: DataItem[]): Record<string, any> {
    // 创建节点映射
    const nodeMap: Record<string | number, Node> = {};
    data.forEach(item => {
        nodeMap[item.id] = { value: item.value, children: {} };
    });

    // 构建树结构
    const root: Record<string, any> = {};
    data.forEach(item => {
        const node = nodeMap[item.id];

        if (!item.parentId) {
            // 根节点
            root[item.name] = node.children;
            root[item.name].value = node.value;
        } else {
            // 子节点
            const parent = nodeMap[item.parentId];
            if (parent) {
                parent.children[item.name] = node.children;
                parent.children[item.name].value = node.value;
            }
        }
    });

    return root;
}

/**
 * 将只存在value字段的父节点的值设置为value字段的值
 * @param obj
 */
export function setParentValue(obj: Record<string, any>): void {
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            setParentValue(obj[key]);
            const keys = Object.keys(obj[key]);
            // 只存在value字段
            if (keys.length === 1 && keys[0] === 'value') {
                obj[key] = obj[key].value;
            }
        }
    }
}