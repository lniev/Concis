import React, { createContext, Ref, useEffect, useState, useRef } from 'react';
import FormItem from './form-item';
import { FormProps, ruleType } from './interface';
import './styles/index.module.less';

export const ctx = createContext<any>({} as any); //顶层通信装置

export interface FormComponent {
  Item: typeof FormItem;
}
export interface FromRefFunctions {
  formRef: string;
  onSubmit: Function;
  resetFields: Function;
  validateFields: Function;
  useFormContext: Function;
}
export type fieldListType = {
  rules?: Array<any>;
  val?: string;
};
const collectFormFns: FromRefFunctions = {
  formRef: '',
  onSubmit: () => {},
  resetFields: () => {},
  validateFields: () => {},
  useFormContext: () => {},
};

const Form = <T,>(props: FormProps<T>) => {
  const { children, layout = 'horizontal', style, formField = null, disabled } = props;

  const [fieldList, setFieldList] = useState<any>({});
  const [reset, setReset] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(false);
  const depsValList = useRef<Array<string>>([]); //所有受控控件的值

  const getChildVal = (depVal: string) => {
    //提交时获取Form.Item中控件的值
    console.log(depVal);
    depsValList.current.push(depVal);
  };
  //根组件状态管理，向下传入
  const providerList = {
    layout,
    reset,
    submitStatus,
    getChildVal,
  };

  const outputFormData = () => {
    //生成表体内容
    const depsCloneList = depsValList.current;
    const returnField = JSON.parse(JSON.stringify(fieldList));
    console.log(fieldList);
    for (var key in fieldList) {
      returnField[key].val = depsCloneList[0];
      depsCloneList.shift();
    }
    depsValList.current = [];
    return returnField;
  };
  const onSubmit = (ref: Ref<T> | null) => {
    //表单提交
    return new Promise((resolve) => {
      setSubmitStatus(true);
      setTimeout(async () => {
        setSubmitStatus(false);
        const result = outputFormData();
        const ruleResult = validateFields(result, ref);
        if (Object.keys(ruleResult).length > 0) {
          resolve({ ...{ submitResult: false }, ruleResult });
        }
        resolve({ ...{ submitResult: true }, result });
      });
    });
  };

  const validateFields = (resultField: any, ref: Ref<T> | null) => {
    //表单校验
    if (resultField === undefined) {
      resultField = outputFormData();
    }
    const resultRules: any = {};
    for (var key in resultField) {
      const field = fieldList[key];
      const value = resultField[key].val;
      if (field.rules) {
        let isPass = true;
        const rules = fieldList[key].rules;
        rules.forEach((rule: ruleType) => {
          if (rule.required && value == '' && isPass) {
            isPass = false;
            changeValidateText(` .form-item .${key}`, rule.message, key, ref);
          } else if (rule.maxLength && value.length > rule.maxLength && isPass) {
            isPass = false;
            changeValidateText(` .form-item .${key}`, rule.message, key, ref);
          } else if (rule.minLength && value.length < rule.minLength && isPass) {
            isPass = false;
            changeValidateText(` .form-item .${key}`, rule.message, key, ref);
          } else {
            if (rule.fn && !rule.fn(value)) {
              isPass = false;
              changeValidateText(` .form-item .${key}`, rule.message, key, ref);
            }
          }
          if (
            isPass &&
            (ref as any).current.querySelector(` .form-item .${key} .show-rule-label`)
          ) {
            (ref as any).current
              .querySelector(` .form-item .${key} .show-rule-label`)
              ?.setAttribute('class', 'hide-rule-label');
          }
        });
      }
    }
    function changeValidateText(
      className: string,
      text: string,
      field: string,
      ref: Ref<T | unknown> | null,
    ) {
      resultRules[field] = text;
      const hideDom = (ref as any).current.querySelector(
        `${className} .hide-rule-label`,
      ) as HTMLElement;
      const showDom = (ref as any).current.querySelector(
        `${className} .show-rule-label`,
      ) as HTMLElement;
      if (hideDom) {
        hideDom.innerText = text;
      } else {
        showDom.innerText = text;
      }
      hideDom?.setAttribute('class', 'show-rule-label');
    }
    return resultRules;
  };
  const resetFields = (ref: Ref<T | unknown> | null) => {
    //重置表单
    console.log(142, fieldList);
    setReset(true);
    setTimeout(() => {
      setReset(false);
    });
  };
  const useFormContext = () => {
    //表单提交
    return new Promise((resolve) => {
      setSubmitStatus(true);
      setTimeout(async () => {
        setSubmitStatus(false);
        const result = outputFormData();
        resolve(result);
      });
    });
  };
  useEffect(() => {
    if (formField) {
      const fieldL: any = {};
      children.forEach((child: any) => {
        if (child.props.field) {
          const key = child.props.field;
          fieldL[key] = {};
          fieldL[key].rules = child.props.rules || null;
          fieldL[key].val = '';
        }
      });
      setFieldList(fieldL);
    }
  }, []);
  useEffect(() => {
    if (formField) {
      collectFormFns.onSubmit = onSubmit;
      collectFormFns.resetFields = resetFields;
      collectFormFns.validateFields = validateFields;
      collectFormFns.useFormContext = useFormContext;
      collectFormFns.formRef = formField;
    }
  }, [fieldList, formField]);

  return (
    <ctx.Provider value={providerList}>
      <div className="form" style={style} ref={formField || null}>
        {disabled && <div className="disabled" />}
        {children}
      </div>
    </ctx.Provider>
  );
};

Form.Item = FormItem;
Form.useForm = () => {
  return collectFormFns;
};

export default Form;
