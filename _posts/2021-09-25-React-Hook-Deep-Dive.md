---
title: React Hook Deep Dive
description: >
  React Deep Dive 프로젝트 첫 번째, Hook에 대해서
tags:
  - FE
  - React
  - Hook
  - TODO👀
cover: /assets/images/fe/react-hook-deep-dive/cover.jpg

---

## 0. Hook이 도입된 배경

Hook은 React 16.8v 부터 새로 추가가 되었다. 함수형 프로그래밍이 FE 세계에서 확장되어가던 추세가 반영된 패치로, Class 개념 중심의 React가 함수 중심의 설계방식으로 사용가능하게 만들어준 개념이다.

Hook이 도입된 이유에는 단순히 함수형 프로그래밍으로 넘어가기 위한 것은 아니다. React라는 view library가 흥행할 수 있었던 근본적인 원인은 각 영역을 '컴포넌트' 단위로 분리할 수 있다는 점이다.

기존에는 다양한 javascript 라이브러리를 통해서 DOM에 직접 접근 및 조정을 해야했기에 코드의 단순 반복 작업 및 유지 보수, 모듈화가 어려웠다. 하지만 React를 도입하면서 컴포넌트 단위로 분리하고, 각 컴포넌트에 비즈니스 로직을 작업할 수 있게 됨으로써 DOM에 접근하기 위한 수 많은 코드들을 단순화 하는게 가능해졌다.

하지만 기존의 React 에서는 클래스를 바탕으로 구현이 되었기 때문에 각 컴포넌트 사이에 비즈니스 혹은 상태 로직을 재사용하기가 어려웠다. 이를 해결하는 방법에는 [Render Props](https://ko.reactjs.org/docs/render-props.html) 를 사용해서 공유하거나, [HoC - 고차 컴포넌트](https://ko.reactjs.org/docs/higher-order-components.html) 를 이용해서 컴포넌트를 재구성해 새로운 컴포넌트로 반환하는 식으로 로직이나 상태값을 공유해야만 했다.

```react
// Render Props
<DataProvider render={({target, title, description}) => (
  <div>
    <h1>{title}</h1>
    <h2>{description}</h2>
    <h3>{target}</h3>
  </div>
)}/>
```

```react
// HoC - HigherOrderComponent
function withState(WrappedComponent) {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.handleCountUp = this.handleCountUp.bind(this);
      // 이 클래스의 상태값에 DB혹은 다른 상태값과 연동되게 만든다면
      // 'withState'로 감싸지는 컴포넌트는 상태를 공유할 수 있게 된다.
      this.state = {
        count: 0
      };
    }
      
    handleCountUp() {
      this.setState({
        count: this.state.count + 1
      })
    }
      
    render() {
      // 상태값을 별도의 props로 내려주거나
      // HoC의 props를 하위 컴포넌트에 그대로 전달하는 것이 가능하다.
      return <WrappedComponent count={this.state.count} {...this.props} />;
    }
  }
}
```

이러한 공유 방식의 문제는 컴포넌트를 재구성이 반드시 필요하게 될 뿐더러, 추상화된 레이어로 덮어지고 쌓이는 심층적 구조가 만들어질 수 밖에 없다. Hook은 이러한 계층의 변화 없이 컴포넌트로부터 상태 관련 로직을 독립적으로 추상화하는게 가능하게 도와준다.



## 1. Hook의 개요

Hook은 함수 컴포넌트에서 React state와 lifecycle features을 연동(**hook into**) 할 수 있게 해준다 해서 붙여진 이름이다. React에서 제공하는 Hook이나 커스텀 Hook 모두 다음 두 가지 [규칙](https://ko.reactjs.org/docs/hooks-rules.html)을 지켜야 한다.

- **최상위 레벨에서만 Hook을 호출해야 한다.** 반복문, 조건문, 중첩 함수 내에서 Hook을 실행할 수 없다.
- **React 함수 컴포넌트 내에서만 Hook을 호출해야 한다.** 일반 javascript 내에서 hook을 호출하면 안된다. 예외적으로 custom hook 내에서는 hook을 호출할 수 있다.

[Hook의 종류](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactInternalTypes.js#L30-L47)는 다양한데, 기본적으로 Hook이 어떻게 동작하는지 알고 싶어서 library 코드를 파고들었다.

[facebook/react github repository - ReactHooks.js - useState](https://github.com/facebook/react/blob/main/packages/react/src/ReactHooks.js#L74-L79) 코드를 살펴보면 다음과 같다.

```typescript
type BasicStateAction<S> = (S => S) | S;
type Dispatch<A> = A => void;

export function useState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
};
```

- type S 형식을 가지는 state를 생성
- 상태 초기값은 'type S 형식을 가지는 값을 반환하는 함수' 혹은 'type S 형식을 가지는 값'
- `resolveDispatcher` 로 부터 생성된 dispatcher를 이용해서 useState 메서드 실행결과 반환
- 반환 형식은 배열이며, 상태값과 상태값 변경 함수를 반환

여기서 **resolveDispatcher** 함수는 모든 hook에서 사용되는데, 다음과 같이 [정의](https://github.com/facebook/react/blob/main/packages/react/src/ReactCurrentDispatcher.js)되어 있다.

```typescript
// https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactInternalTypes.js
export type Dispatcher = {
  // ...
  useState<S>(initialState: (() => S) | S): [S, Dispatch<BasicStateAction<S>>],
  // ...
};

const ReactCurrentDispatcher = {
  current: null | Dispatcher,
};

function resolveDispatcher() {
  const dispatcher = ReactCurrentDispatcher.current;
  return ((dispatcher: any): Dispatcher);
}
```

이렇게 코드를 파고 들었을 때  **'타입 정의와 함수 뼈대는 알겠는데, 그래서 함수 구현 부분이 어디있는거지?'** 라는 생각이 들었다. 그래서 코드를 더 파고 들어가서 `react-reconciler` 영역에서 [구현부](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberHooks.new.js)를 찾을 수 있었다.



## 2. Hook의 구현

_(TO-DO Study)_ 아직 reconciler와 Fiber에 대한 정확한 개념을 모르기 때문에, useState 동작과 관련된 부분만 살펴보았고 다음 4가지 상황에 따라 구현되어 있음을 파악했다.

1. **OnlyDispatcher**: [throwInvalidHookError](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberHooks.new.js#L312-L322)

   - version mismatching
   - breaking the Rules of Hooks
   - more than one copy of React in the same app

2. **OnMount**: [mountState](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberHooks.new.js#L1464-L1490)

   ```typescript
   function mountState<S>(
     initialState: (() => S) | S,
   ): [S, Dispatch<BasicStateAction<S>>] {
     if (typeof initialState === 'function') {
       initialState = initialState();
     }
     const hook = mountWorkInProgressHook();
     hook.memoizedState = hook.baseState = initialState;
     const queue: UpdateQueue<S, BasicStateAction<S>> = {
       pending: null,
       interleaved: null,
       lanes: NoLanes,
       dispatch: null,
       lastRenderedReducer: basicStateReducer,
       lastRenderedState: (initialState: any),
     };
     hook.queue = queue;
     const dispatch: Dispatch<
       BasicStateAction<S>,
     > = (queue.dispatch = (dispatchAction.bind(
       null,
       currentlyRenderingFiber,
       queue,
     ): any));
     return [hook.memoizedState, dispatch];
   }
   ```

   코드를 하나씩 분해해서 살펴보자.

   

   ```typescript
   if (typeof initialState === 'function') {
     initialState = initialState();
   }
   ```

   우선 initialState는 함수도 가능하기 때문에 `() => S`를 `S`로 바꿔서 initialState에 저장한다.

   


   ```typescript
   function mountWorkInProgressHook(): Hook {
     const hook: Hook = {
       memoizedState: null,
       baseState: null,
       baseQueue: null,
       queue: null,
       next: null,
     };
   
     if (workInProgressHook === null) {
       // list에서 첫 번째 Hook
       currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
     } else {
       // list 마지막에 추가
       workInProgressHook = workInProgressHook.next = hook;
     }
     return workInProgressHook;
   }
   
   const hook = mountWorkInProgressHook()
   hook.memoizedState = hook.baseState = initialState;
   ```

   _(TO-DO Study)_ memoizedState와 baseState, queue와 baseQueue의 차이

   

   ```typescript
   export type UpdateQueue<S, A> = {|
     pending: Update<S, A> | null,
     interleaved: Update<S, A> | null,
     lanes: Lanes,
     dispatch: (A => mixed) | null,
     lastRenderedReducer: ((S, A) => S) | null,
     lastRenderedState: S | null,
   |};
   
   function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
     return typeof action === 'function' ? action(state) : action;
   }
   
   const queue: UpdateQueue<S, BasicStateAction<S>> = {
     pending: null,
     interleaved: null,
     lanes: NoLanes,
     dispatch: null,
     lastRenderedReducer: basicStateReducer,
     lastRenderedState: (initialState: any),
   };
   hook.queue = queue;
   ```

   _(TO-DO Study)_ Queue 구성 요소들의 의미

   

   ```typescript
   const dispatch: Dispatch<A> = (queue.dispatch = (dispatchAction.bind(
     null,
     currentlyRenderingFiber,
     queue,
   ): any));
   return [hook.memoizedState, dispatch];
   ```

   _(TO-DO Study)_ [dispatchAction](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberHooks.new.js#L2153-L2302) 의 구현 분석. Fiber 동작과 밀접하게 연관이 있는 듯 보인다.

   

3. **OnUpdate**: [updateState](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberHooks.new.js#L1492-L1496)

   ```typescript
   function updateState<S>(
     initialState: (() => S) | S,
   ): [S, Dispatch<BasicStateAction<S>>] {
     return updateReducer(basicStateReducer, (initialState: any));
   }
   ```

   _(TO-DO Study)_ [updateReducer](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberHooks.new.js#L741-L894) 의 구현 분석.

   

4. **OnRerender**: rerenderState

   ```typescript
   function rerenderState<S>(
     initialState: (() => S) | S,
   ): [S, Dispatch<BasicStateAction<S>>] {
     return rerenderReducer(basicStateReducer, (initialState: any));
   }
   ```

   _(TO-DO Study) [rerenderReducer](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberHooks.new.js#L896-L948) 의 구현 분석.

   rerendering의 과정에서의 useState 함수는 rerenderState로 정의된다. 이 함수는 updateState함수와 마찬가지로 로직을 별도의 함수인 **rerenderReducer** 로 실행하도록 구조를 설계했다. 따라서 rerenderState 함수가 어떻게 동작하는지 파악하기 위해 rerenderReducer 함수를 파헤쳐보자.

   

   ```typescript
   function rerenderReducer<S, I, A>(
     reducer: (S, A) => S,
     initialArg: I,
     init?: I => S,
   ): [S, Dispatch<A>] {
     const hook = updateWorkInProgressHook();
     const queue = hook.queue;
     queue.lastRenderedReducer = reducer;
   
     // re-render 관련 코드. 새로운 render 업데이트를 이전에 진행 중인 Hook에 적용
     const dispatch: Dispatch<A> = (queue.dispatch: any);
     const lastRenderPhaseUpdate = queue.pending;
     let newState = hook.memoizedState;
     if (lastRenderPhaseUpdate !== null) {
       // queue는 render 이후에 유지되지 않음
       queue.pending = null;
   
       const firstRenderPhaseUpdate = lastRenderPhaseUpdate.next;
       let update = firstRenderPhaseUpdate;
       do {
         // 현재 render 업데이트를 진행.
         // 현재 진행 중인 render와 항상 동일하기 때문에 우선순위를 확인할 필요가 없음
         const action = update.action;
         newState = reducer(newState, action);
         update = update.next;
       } while (update !== firstRenderPhaseUpdate);
   
       // 새로운 state가 현재 state와 다를 경우 fiber 로직이 수행되었는지 체크
       if (!is(newState, hook.memoizedState)) {
         markWorkInProgressReceivedUpdate();
       }
   
       hook.memoizedState = newState;
       // queue가 비어있을 경우 render에서 누적된 state를 baseState로 유지
       if (hook.baseQueue === null) {
         hook.baseState = newState;
       }
   
       queue.lastRenderedState = newState;
     }
     return [newState, dispatch];
   }
   ```

   





### 1-2. useEffect

React 컴포넌트 안에서 데이터를 가져오거나 구독, DOM 조작등의 작업을 총칭하여 'side effects (줄여서 effects)' 라고 한다. 왜냐하면 이러한 작업들은 다른 컴포넌트에 영향을 줄 수도 있고, 렌더링 과정에서는 구현할 수 없는 작업이기 때문이다.

기본적으로 React는 첫 번째 렌더링을 포함해서 매 렌더링 이후에 effects를 실행한다. 그리고 함수를 effects 내에서 반환함으로써 effects를 해제하는 것도 가능하다.