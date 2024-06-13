import React, { useState } from "react";
import ForBox from "./ForBox";
import VariableBox from "./VariableBox";
import IfBox from "./IfBox";
import ElseBox from "./ElseBox";
import PrintBox from "./PrintBox";
import _ from "lodash";

interface ObjectItem {
  id: number;
  type: string;
  depth?: number;
  lightOn: boolean;
  child: AnyObjectItem[];
}
interface State {
  objects: AnyObjectItem[];
}

interface DummyItem {
  id?: number;
  type: string;
  depth?: number;
  value?: number;
  name?: string;
  start?: number;
  end?: number;
  cur?: number;
  expr?: string;
  highlight?: number[] | string[];
  condition?: ConditionItem;
  variable_list?: VariableList[];
}
interface VarItem extends DummyItem {
  lightOn?: boolean;
}
interface VariableList {
  name: string;
  expr: string;
  depth: number;
}
interface ConditionItem {
  target: string;
  start: number;
  end: number;
  cur: number;
  step: number;
}

// Subtype definitions

interface PrintItem extends ObjectItem {
  expr: string;
  highlight: number[];
}

interface ForItem extends ObjectItem {
  start: number;
  startLightOn: boolean;
  end: number;
  endLightOn: boolean;
  cur: number;
  curLightOn: boolean;
  target: string;
  step: number;
  stepLightOn: boolean;
}

interface IfItem extends ObjectItem {}

interface ElseItem extends ObjectItem {}

interface End extends ObjectItem {}

type AnyObjectItem = PrintItem | ForItem | IfItem | ElseItem | End;

// Activate stack type definition
interface ActivateItem {
  id: number;
  depth: number;
}

// Initial data setup
const dummy_json: DummyItem[] = [
  {
    variable_list: [
      {
        depth: 1,
        expr: "3",
        name: "a",
      },
    ],
    type: "varList",
  },
  {
    id: 1,
    depth: 1,
    condition: {
      target: "i",
      cur: 0,
      start: 0,
      end: 3,
      step: 1,
    },
    highlight: ["target", "cur", "start", "end", "step"],
    type: "for",
  },
  {
    id: 2,
    depth: 2,
    expr: "' ' * (a - (i + 1))",
    highlight: [],
    type: "print",
  },
  {
    id: 2,
    depth: 2,
    expr: "' ' * (3 - (0 + 1))",
    highlight: [7, 12],
    type: "print",
  },
  {
    id: 2,
    depth: 2,
    expr: "  ",
    highlight: [0, 1],
    type: "print",
  },
  {
    id: 3,
    depth: 2,
    expr: "'*' * (i + 1)",
    highlight: [],
    type: "print",
  },
  {
    id: 3,
    depth: 2,
    expr: "'*' * (0 + 1)",
    highlight: [7],
    type: "print",
  },
  {
    id: 3,
    depth: 2,
    expr: "*",
    highlight: [0],
    type: "print",
  },
  {
    id: 1,
    depth: 1,
    condition: {
      target: "i",
      cur: 1,
      start: 0,
      end: 3,
      step: 1,
    },
    highlight: ["cur"],
    type: "for",
  },
  {
    id: 2,
    depth: 2,
    expr: "' ' * (a - (i + 1))",
    highlight: [],
    type: "print",
  },
  {
    id: 2,
    depth: 2,
    expr: "' ' * (3 - (1 + 1))",
    highlight: [7, 12],
    type: "print",
  },
  {
    id: 2,
    depth: 2,
    expr: " ",
    highlight: [0],
    type: "print",
  },
  {
    id: 3,
    depth: 2,
    expr: "'*' * (i + 1)",
    highlight: [],
    type: "print",
  },
  {
    id: 3,
    depth: 2,
    expr: "'*' * (1 + 1)",
    highlight: [7],
    type: "print",
  },
  {
    id: 3,
    depth: 2,
    expr: "**",
    highlight: [0, 1],
    type: "print",
  },
  {
    id: 1,
    depth: 1,
    condition: {
      target: "i",
      cur: 2,
      start: 0,
      end: 3,
      step: 1,
    },
    highlight: ["cur"],
    type: "for",
  },
  {
    id: 2,
    depth: 2,
    expr: "' ' * (a - (i + 1))",
    highlight: [],
    type: "print",
  },
  {
    id: 2,
    depth: 2,
    expr: "' ' * (3 - (2 + 1))",
    highlight: [7, 12],
    type: "print",
  },
  {
    id: 2,
    depth: 2,
    expr: "",
    highlight: [],
    type: "print",
  },
  {
    id: 3,
    depth: 2,
    expr: "'*' * (i + 1)",
    highlight: [],
    type: "print",
  },
  {
    id: 3,
    depth: 2,
    expr: "'*' * (2 + 1)",
    highlight: [7],
    type: "print",
  },
  {
    id: 3,
    depth: 2,
    expr: "***",
    highlight: [0, 1, 2],
    type: "print",
  },
];

const RightSection: React.FC = () => {
  const [idx, setIdx] = useState<number>(0);
  const [usedId, setUsedId] = useState<number[]>([]); // 한 번사용한 id를 저장하는 리스트
  const [visual, setVisual] = useState<State>({
    // 시각화전에 데이터를 담아두는 리스트 객체
    objects: [{ id: 0, type: "start", depth: 0, lightOn: false, child: [] }],
  });
  const [varData, setVarData] = useState<DummyItem[]>([]); // 변수 데이터 시각화 리스트
  const [usedName, setUsedName] = useState<string[]>([]); // 사용한 변수 데이터 name 모아두는 리스트
  const [activate, setActivate] = useState<ActivateItem[]>([]); // Active stack list

  const createNewObject = (idx: number): AnyObjectItem => {
    const baseObject: ObjectItem = {
      id: dummy_json[idx].id!,
      type: dummy_json[idx].type,
      depth: dummy_json[idx].depth,
      lightOn: false,
      child: [],
    };

    switch (dummy_json[idx].type) {
      case "print":
        return {
          ...baseObject,
          expr: dummy_json[idx].expr!,
          highlight: dummy_json[idx].highlight!,
        } as PrintItem;
      case "for":
        return {
          ...baseObject,
          start: dummy_json[idx].condition!.start,
          end: dummy_json[idx].condition!.end,
          cur: dummy_json[idx].condition!.cur,
          target: dummy_json[idx].condition!.target,
          step: dummy_json[idx].condition!.step,
        } as ForItem;
      case "if":
        return baseObject as IfItem;
      case "else":
        return baseObject as ElseItem;
      default:
        return baseObject as End;
    }
  };

  const addChild = (
    items: AnyObjectItem[],
    targetDepth: number,
    newObject: AnyObjectItem
  ): AnyObjectItem[] => {
    let updated = false;
    return items.map((item) => {
      if (!updated && item.depth === targetDepth - 1) {
        updated = true;
        return { ...item, child: [...item.child, newObject] };
      } else if (item.child && item.child.length > 0) {
        return {
          ...item,
          child: addChild(item.child, targetDepth, newObject),
        };
      }
      return item;
    });
  };

  const updateChild = (
    items: AnyObjectItem[],
    targetId: number,
    newObject: AnyObjectItem
  ): AnyObjectItem[] => {
    return items.map((item) => {
      if (item.id === targetId) {
        return { ...item, ...newObject, child: item.child };
      } else if (item.child && item.child.length > 0) {
        return { ...item, child: updateChild(item.child, targetId, newObject) };
      } else {
        return item;
      }
    });
  };

  const turnLightOn = (
    new_data: AnyObjectItem[],
    newActivate: ActivateItem[]
  ): AnyObjectItem[] => {
    return new_data.map((item) => {
      if (newActivate.some((data) => data.id === item.id)) {
        return {
          ...item,
          lightOn: true,
          child: turnLightOn(item.child, newActivate),
        };
      } else if (item.child && item.child.length > 0) {
        return {
          ...item,
          lightOn: false,
          child: turnLightOn(item.child, newActivate),
        };
      } else {
        return { ...item, lightOn: false };
      }
    });
  };
  const updateVar = (
    targetName: string,
    varData: DummyItem[],
    newVar: DummyItem
  ): DummyItem[] => {
    return varData.map((item) => {
      if (item.name === targetName) {
        return { ...item, ...newVar };
      } else {
        return item;
      }
    });
  };

  const updateActivate = (
    activate: ActivateItem[],
    targetDepth: number,
    targetId: number
  ): ActivateItem[] => {
    let tmp: ActivateItem[] = [];

    for (let element of activate) {
      if (element.depth === targetDepth) {
        tmp.push({ id: targetId, depth: targetDepth });
        return tmp;
      }
    }
    tmp.push({ id: targetId, depth: targetDepth });

    return tmp;
  };

  const renderComponent = (items: AnyObjectItem[]): JSX.Element | null => {
    return (
      <>
        {items.map((item) => {
          switch (item.type) {
            case "print":
              const print = item as PrintItem;
              return (
                <React.Fragment key={item.id}>
                  <PrintBox
                    key={print.id}
                    expr={print.expr}
                    highlight={print.highlight}
                    lightOn={print.lightOn}
                  />
                  {renderComponent(item.child)}
                </React.Fragment>
              );
            case "for":
              const forItem = item as ForItem;
              return (
                <ForBox
                  key={forItem.id}
                  start={forItem.start}
                  end={forItem.end}
                  cur={forItem.cur}
                  target={forItem.target}
                  step={forItem.step}
                  lightOn={forItem.lightOn}
                >
                  {renderComponent(forItem.child)}
                </ForBox>
              );
            case "if":
              return (
                <IfBox key={item.id} lightOn={item.lightOn}>
                  {renderComponent(item.child)}
                </IfBox>
              );
            case "else":
              return (
                <ElseBox key={item.id} lightOn={item.lightOn}>
                  {renderComponent(item.child)}
                </ElseBox>
              );
            default:
              return null;
          }
        })}
      </>
    );
  };

  const renderComponentVar = (items: VarItem[]): JSX.Element | null => {
    return (
      <>
        {items.map((item) => (
          <VariableBox
            key={item.name}
            value={item.expr!}
            name={item.name!}
            lightOn={item.lightOn!}
          />
        ))}
      </>
    );
  };

  const handleClick = () => {
    let new_data: AnyObjectItem[] = [];
    if (idx >= dummy_json.length) {
      console.log("더이상 데이터가 없습니다");
      return;
    }

    let copyData = _.cloneDeep(varData);
    console.log(copyData);
    // For variables
    if (dummy_json[idx].type === "varList") {
      dummy_json[idx].variable_list?.forEach((element) => {
        if (usedName.includes(element.name!)) {
          const targetName = element.name!;
          const updatedData = updateVar(targetName, copyData, element);
          copyData = updatedData;
        } else {
          copyData.push(element);
          setUsedName((prevName) => [...prevName, element.name!]);
        }
      });
    } else {
      const newObject = createNewObject(idx);
      if (usedId.includes(dummy_json[idx].id!)) {
        const targetId = dummy_json[idx].id!;

        // updateChild(비주얼 스택, 넣어야하는 위치를 알려주는 id, 넣어야하는 data)
        new_data = updateChild(visual.objects, targetId, newObject);
      } else {
        const targetDepth: number = dummy_json[idx].depth!;

        // 한번 사용한 id는 저장해준다
        setUsedId((prevIds) => [...prevIds, dummy_json[idx].id!]);
        // addChild(비주얼 스택, 넣어야하는 위치를 알려주는 depth, 넣어야하는 data)
        new_data = addChild(visual.objects, targetDepth, newObject);
      }
      const targetId: number = dummy_json[idx].id!;
      const targetDepth: number = dummy_json[idx].depth!;
      const newActivate = updateActivate(activate, targetDepth, targetId);
      const turnLightOnNewData = turnLightOn(new_data, newActivate);

      setActivate(newActivate);
      setVisual({ objects: turnLightOnNewData });
    }

    let tmpItemName;
    if (dummy_json[idx].variable_list === undefined) {
      tmpItemName = [];
    } else {
      tmpItemName = dummy_json[idx].variable_list?.map((element) => {
        return element.name;
      });
    }

    copyData = copyData.map((element) => {
      if (tmpItemName?.includes(element.name)) {
        return { ...element, lightOn: true };
      } else {
        return { ...element, lightOn: false };
      }
    });

    setVarData(copyData);
    setIdx(idx + 1);
  };

  return (
    <div style={{ backgroundColor: "#f4f4f4", width: "100%" }}>
      <div>
        <ul style={{ display: "flex" }}>{renderComponentVar(varData)}</ul>
      </div>

      <ul>{renderComponent(visual.objects[0].child)}</ul>
      <button onClick={handleClick}>특정 객체 child에 객체 생성</button>
    </div>
  );
};

export default RightSection;
