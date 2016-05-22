let Scope = require('../src/scope')
let _ = require('lodash')
describe('Scope', () => {


describe('digest',()=>{

	let scope
	beforeEach(() => {
		scope = new Scope()
	})

	it('should be uses as an object', () => {
		scope.aProperty = 1
		expect(scope.aProperty).toBe(1);
		scope.aProperty = 3
		expect(scope.aProperty).toBe(3);
	});
	it('digest can call listen function', () => {
		let watchFn = () => 'wat'
		let listenFn = jasmine.createSpy()
		scope.$watch(watchFn, listenFn)
		scope.$digest()
		expect(listenFn).toHaveBeenCalled()
			// expect(listenFn).toHaveBeenCalledWith(scope)
	})
	it('call the watch function with scope as argumetns', () => {
		let watchFn = jasmine.createSpy()
		let listenFn = () => {}
		scope.$watch(watchFn, listenFn)
		scope.$digest()
		expect(watchFn).toHaveBeenCalledWith(scope)

	})
	it('call the listen function when the watched value change', () => {
		scope.someValue = 'a'
		scope.counter = 0
		scope.$watch(scope => {
			return scope.someValue
		}, (newVal, oldVal, scope) => {
			scope.counter++
		})
		expect(scope.counter).toBe(0)
		scope.$digest()
		expect(scope.counter).toBe(1)
		scope.$digest()
		expect(scope.counter).toBe(1)

		scope.someValue = 'b'
		expect(scope.counter).toBe(1)

		scope.$digest()
		expect(scope.counter).toBe(2)

	})
	it('call ths listener when watch value is first undefined', () => {
		scope.counter = 0
		scope.$watch(scope => scope.someValue, (newVal, oldVal, scope) => {
			scope.counter++
		})
		scope.$digest()
		expect(scope.counter).toBe(1)

	})
	it('call listener with new value as old value the first time',()=>{
		scope.someValue = 123
		let oldValueGiven
		scope.$watch(scope=>scope.someValue,(newVal,oldVal,scope)=>{
			oldValueGiven = oldVal
		})
		scope.$digest()
		expect(oldValueGiven).toBe(123)
	})
	it('may have watchers that omit the listen function ',()=>{
		let watchFn = jasmine.createSpy().and.returnValue('something')
		scope.$watch(watchFn)
		scope.$digest()
		expect(watchFn).toHaveBeenCalled()
	})

	it('triggers chained watchers in the same digest',()=>{
		scope.name = 'shengxinjing'
		scope.$watch(scope=>scope.nameUpper,(newVal,oldVal,scope)=>{
			if (newVal) {
				scope.initial = newVal.substring(0, 1)+'.'
			};

		})

		scope.$watch(scope=>scope.name,(newVal,oldVal,scope)=>{
			if (newVal) {
				scope.nameUpper = newVal.toUpperCase()
			};
		})
		scope.$digest()
		expect(scope.initial).toBe('S.')

		scope.name = 'woniu'
		scope.$digest()
		expect(scope.initial).toBe('W.')

	})
	it('gives up on the watches after 10 times',()=>{
		scope.countA = 0
		scope.countB = 0
		scope.$watch(scope=>scope.countA,(newVal,oldVal,scope)=>{
			scope.countB++
		})
		scope.$watch(scope=>scope.countB,(newVal,oldVal,scope)=>{
			scope.countA++
		})
		expect((function(){scope.$digest()})).toThrow()
	})
	it('ends the digest when the last watch id clean',()=>{
		scope.arr = _.range(100)
		let watchExecutions = 0

		_.times(100,(i)=>{
			scope.$watch((scope)=>{
				watchExecutions++
				return scope.arr[i]
			},(newVal,oldVal,scope)=>{

			})
		})
		scope.$digest()
		expect(watchExecutions).toBe(200)

		scope.arr[0] = 88
		scope.$digest()
		expect(watchExecutions).toBe(301)
	})
	it('does not end digest so that new watches are not run',()=>{
		scope.aValue = 'abc'
		scope.counter=0
		scope.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
			scope.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
				scope.counter++
			})
		})
		scope.$digest()
		expect(scope.counter).toBe(1)
	})
	it('compares based on value if enables',()=>{
		scope.aValue = [1,2,3]
		scope.counter = 0
		scope.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
			scope.counter++
		},true)

		scope.$digest()
		expect(scope.counter).toBe(1)

		scope.aValue.push(4)
		scope.$digest()
		expect(scope.counter).toBe(2)
	})
	it('correctly handles NaNs',()=>{
		scope.number = 0/'aa'
		scope.counter = 0
		scope.$watch(scope=>scope.number,(newVal,oldVal,scope)=>{
			scope.counter++
		})

		scope.$digest()
		expect(scope.counter).toBe(1)
		scope.$digest()
		expect(scope.counter).toBe(1)
	})

	it('execute $eval function and retuen results',()=>{
		scope.aValue = 2
		let result = scope.$eval(scope=>scope.aValue)
		expect(result).toBe(2)
	})
	it('passes the second $eval argument straight through',()=>{
		scope.aValue = 2
		let result = scope.$eval((scope,arg)=>{
			return scope.aValue+arg
		},2)
		expect(result).toBe(4)
	})

	it('executes apply function and starts the digest',()=>{
		scope.aValue = 'woniu'
		scope.counter = 0

		scope.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
			scope.counter++
		})

		scope.$digest()
		expect(scope.counter).toBe(1)

		scope.$apply((scope)=>{
			scope.aValue = 'mushbroom'
		})
		expect(scope.counter).toBe(2)
	})

	it('execute $evalAsync function later in the same cycle',()=>{
		scope.aValue = [1,2,3]
		scope.asyncEvaluated = false
		scope.asyncEvaluatedImmediately = false

		scope.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
			scope.$evalAsync((scope)=>{
				scope.asyncEvaluated = true
			})
			scope.asyncEvaluatedImmediately = scope.asyncEvaluated
		})

		scope.$digest()
		expect(scope.asyncEvaluated).toBe(true)
		expect(scope.asyncEvaluatedImmediately).toBe(false)
	})

	it('execute $evalAsync function add by watch function ',()=>{
		scope.aValue = [1,2,3]
		scope.asyncEvaluated = false

		scope.$watch((scope)=>{
			if (!scope.asyncEvaluated) {
				scope.$evalAsync((scope)=>{
					scope.asyncEvaluated = true
				})
			};
			return scope.aValue
		},(newVal,oldVal,scope)=>{})

		scope.$digest()
		expect(scope.asyncEvaluated).toBe(true)
	})



	it('execute $evalAsync function even when not dirty ',()=>{
		scope.aValue = [1,2,3]
		scope.asyncEvaluatedTimes = 0

		scope.$watch((scope)=>{
			if (scope.asyncEvaluatedTimes<2) {
				scope.$evalAsync((scope)=>{
					scope.asyncEvaluatedTimes++
				})
			};
			return scope.aValue
		},(newVal,oldVal,scope)=>{})

		scope.$digest()
		expect(scope.asyncEvaluatedTimes).toBe(2)
	})
	it('eventually halts $evalAsync add by watchers ',()=>{
		scope.aValue = [1,2,3]

		scope.$watch((scope)=>{
			scope.$evalAsync((scope)=>{})
			return scope.aValue
		},(newVal,oldVal,scope)=>{})

		expect(()=>scope.$digest()).toThrow()
	})


	it('has a $$parse field whose value is the current digest phase',()=>{
		scope.aValue = [1,2,3]
		scope.phaseWatch = undefined
		scope.phaseListen = undefined
		scope.phaseApply = undefined

		scope.$watch(scope=>{
			scope.phaseWatch = scope.$$phase
		},(newval,oldval,scope)=>{
			scope.phaseListen = scope.$$phase			
		})

		scope.$apply(scope=>{
			scope.phaseApply = scope.$$phase			
		})
		expect(scope.phaseWatch).toBe('$digest')
		expect(scope.phaseListen).toBe('$digest')
		expect(scope.phaseApply).toBe('$apply')

	})

	it('schedules a digest in $evalAsync',(done)=>{
		scope.aValue = 'woniu'
		scope.counter = 0

		scope.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
			scope.counter++
		})

		scope.$evalAsync(()=>{})
		expect(scope.counter).toBe(0)

		setTimeout(()=>{
			expect(scope.counter).toBe(1)
			done()
		},50)
	})
	it('allow asyn $apply with $applyAsync',(done)=>{
		scope.counter = 0
		scope.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
			scope.counter++
		})
		scope.$digest()
		expect(scope.counter).toBe(1)

		scope.$applyAsync(scope=>{
			scope.aValue = 'woniu'
		})
		expect(scope.counter).toBe(1)

		setTimeout(()=>{
			expect(scope.counter).toBe(2)
			done()
		},50)
	})
	it('never executes $applyAsync function in this same ciycle',(done)=>{
		scope.aValue = [1,2,3]
		scope.asyncApplied = false


		scope.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{

			scope.$applyAsync(scope=>{
				scope.asyncApplied = true
			})
		})
		scope.$digest()
		expect(scope.asyncApplied).toBe(false)
		setTimeout(()=>{
			expect(scope.asyncApplied).toBe(true)
			done()
		},50)
	})
	it('coalesces many calss to $applyAsync',done=>{
		scope.counter = 0
		scope.$watch(scope=>{
			scope.counter++
			return scope.aValue	
		},(newVal,oldVal,scope)=>{
		})

		scope.$applyAsync(scope=>{
			scope.aValue = 'woniu'
		})
		scope.$applyAsync(scope=>{
			scope.aValue = 'mushbroom'
		})

		setTimeout(()=>{
			expect(scope.counter).toBe(2)
			done()
		},50)

	})

	it('cancels and flush $applyAsync if digested first',done=>{
		scope.counter = 0
		scope.$watch(scope=>{
			scope.counter++
			return scope.aValue	
		},(newVal,oldVal,scope)=>{
		})

		scope.$applyAsync(scope=>{
			scope.aValue = 'woniu'
		})
		scope.$applyAsync(scope=>{
			scope.aValue = 'mushbroom'
		})
		scope.$digest()
		expect(scope.counter).toBe(2)
		expect(scope.aValue).toBe('mushbroom')


		setTimeout(()=>{
			expect(scope.counter).toBe(2)
			done()
		},50)

	})

	it('runs a $$postDigest function after each digest',()=>{
		scope.counter = 0
		scope.$$postDigest(()=>{
			scope.counter++
		})
		expect(scope.counter).toBe(0)
		scope.$digest()
		expect(scope.counter).toBe(1)
		scope.$digest()
		expect(scope.counter).toBe(1)
	})
	it('does not include $$postDigest in the digest',()=>{
		scope.aValue = 'woniu'
		scope.$$postDigest(()=>{
			scope.aValue = 'mushbroom'
		})
		scope.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
			scope.watcheValue = newVal
		})
		scope.$digest()
		expect(scope.watcheValue).toBe('woniu')
		// expect(scope.aValue).toBe('woniu')
		scope.$digest()
		expect(scope.watcheValue).toBe('mushbroom')
	})


	it('caches exception in watch function and continue',()=>{
		scope.aValue = 'woniu'
		scope.counter = 0
		scope.$watch(scope=>{
			throw 'error'
		},(newVal,oldVal,scope)=>{})
		scope.$watch(scope=>{
			return scope.aValue
		},(newVal,oldVal,scope)=>{
			scope.counter++
		})

		scope.$digest()
		expect(scope.counter).toBe(1)
	})
	it('caches exception in listener function and continue',()=>{
		scope.aValue = 'woniu'
		scope.counter = 0
		scope.$watch(scope=>{
			return scope.aValue
		},(newVal,oldVal,scope)=>{
			throw 'error'
		})
		scope.$watch(scope=>{
			return scope.aValue
		},(newVal,oldVal,scope)=>{
			scope.counter++
		})

		scope.$digest()
		expect(scope.counter).toBe(1)
	})

	it('catch exception in $evalAsync',(done)=>{
		scope.aValue = 'woniu'
		scope.counter = 0
		scope.$watch(scope=>{
			return scope.aValue
		},(newVal,oldVal,scope)=>{
			scope.counter++
		})
		scope.$evalAsync(scope=>{
			throw 'evalAsync Error'
		})
		setTimeout(()=>{
			expect(scope.counter).toBe(1)
			done()
		})
	})

	it('catch exception in $applyAsync',(done)=>{

		scope.$applyAsync(scope=>{
			throw 'applyAsync Error'
		})
		scope.$applyAsync(scope=>{
			throw 'applyAsync Error'
		})
		scope.$applyAsync(scope=>{
			scope.applied = true
		})
		setTimeout(()=>{
			expect(scope.applied).toBe(true)
			done()
		})
	})

	it('catch exception in $postDigest',()=>{
		var didRun = false
		scope.$$postDigest(()=>{
			throw 'postDigest Error'
		})
		scope.$$postDigest(()=>{
			didRun = true
		})
		scope.$digest()
		expect(didRun).toBe(true)


	})

	it('allow destroying a $watch with a removal function',()=>{
		scope.aValue = 'woniu'
		scope.counter = 0

		let destroyWatch = scope.$watch(scope=>scope.aValue,()=>{
			scope.counter++
		})
		scope.$digest()
		expect(scope.counter).toBe(1)

		scope.aValue = 'mushbroom'
		scope.$digest()
		expect(scope.counter).toBe(2)

		scope.aValue = 'test'
		destroyWatch()
		scope.$digest()
		expect(scope.counter).toBe(2)


	})

	it('allow destroy watcher during digest',()=>{
		scope.aValue = 'woniu'
		var watchCalls = []
		scope.$watch(scope=>{
			watchCalls.push('first')
			return scope.aValue
		})
		var destroyWatch = scope.$watch(scope=>{
			watchCalls.push('second')
			destroyWatch()
		})
		scope.$watch(scope=>{
			watchCalls.push('third')
			return scope.aValue
		})
		scope.$digest()
		expect(watchCalls).toEqual(['first','second','third','first','third'])
	})

	it('allows a watch to destroy another during digest',()=>{
		scope.aValue = 'woniu'
		scope.counter = 0
		scope.$watch(scope=>scope.aValue,()=>{
			destroyWatch()
		})
		var destroyWatch = scope.$watch(()=>{},()=>{})
		scope.$watch(scope=>scope.aValue,()=>{
			scope.counter++
		})

		scope.$digest()
		expect(scope.counter).toBe(1)
	})

})

describe('watchGroup',()=>{
	let scope
	beforeEach(() => {
		scope = new Scope()
	})



	it('takes watches as an array and calls listener with arrays',()=>{
		var gotNewVals, gotOldVals
		scope.aValue = 1
		scope.anotherValue = 2
		scope.$watchGroup([
			scope=>scope.aValue,
			scope=>scope.anotherValue
		],(newVals,oldVals,scope)=>{
			gotNewVals = newVals
			gotOldVals = oldVals
		})
		scope.$digest()
		expect(gotNewVals).toEqual([1,2])
		expect(gotOldVals).toEqual([1,2])
	})


	it('only call listener once in one digest',()=>{
		var counter = 0
		scope.aValue = 1
		scope.anotherValue = 2
		scope.$watchGroup([
			scope=>scope.aValue,
			scope=>scope.anotherValue
		],(newVals,oldVals,scope)=>{
			counter++
		})
		scope.$digest()
		expect(counter).toBe(1)
	})

	it('use same array of new and old on first run',()=>{
		var gotNewVals, gotOldVals
		scope.aValue = 1
		scope.anotherValue = 2
		scope.$watchGroup([
			scope=>scope.aValue,
			scope=>scope.anotherValue
		],(newVals,oldVals,scope)=>{
			gotNewVals = newVals
			gotOldVals = oldVals
		})
		scope.$digest()
		expect(gotNewVals).toBe(gotOldVals)
	})

	it('use different array of new and old on subsequent run',()=>{
		var gotNewVals, gotOldVals
		scope.aValue = 1
		scope.anotherValue = 2
		scope.$watchGroup([
			scope=>scope.aValue,
			scope=>scope.anotherValue
		],(newVals,oldVals,scope)=>{
			gotNewVals = newVals
			gotOldVals = oldVals
		})
		scope.$digest()
		scope.anotherValue = 3
		scope.$digest()
		expect(gotNewVals).toEqual([1,3])
		expect(gotOldVals).toEqual([1,2])
	})
	it('call the listrner once when the watch array in empty',()=>{
		var gotNewVals, gotOldVals
		scope.aValue = 1
		scope.anotherValue = 2
		scope.$watchGroup([],(newVals,oldVals,scope)=>{
			gotNewVals = newVals
			gotOldVals = oldVals
		})
		scope.$digest()
		expect(gotNewVals).toEqual([])
		expect(gotOldVals).toEqual([])
	})

	it('watchGroupt can be deregisteed',()=>{
		scope.counter = 0
		scope.aValue = 1
		scope.anotherValue = 2
		var destroyGroup = scope.$watchGroup([
			scope=>scope.aValue,
			scope=>scope.anotherValue
		],(newVals,oldVals,scope)=>{
			scope.counter++
		})
		scope.$digest()
		scope.anotherValue = 3
		destroyGroup()
		scope.$digest()
		expect(scope.counter).toEqual(1)
	})

	it('does not call the zero-watch listener when deregistered first',()=>{
		scope.counter = 0
		var destroyGroup = scope.$watchGroup([],(newVals,oldVals,scope)=>{
			scope.counter++
		})
		destroyGroup()
		scope.$digest()
		expect(scope.counter).toEqual(0)
	})

})

describe('inheritance',()=>{
	// let scope
	// beforeEach(() => {
	// 	scope = new Scope
	// })


	it('inherits the parent properties',()=>{
		let parent = new Scope()
		parent.aValue = [1,2,3]
		let child = parent.$new()
		expect(child.aValue).toEqual([1,2,3])
	})	
	it('does not cause a parent to inherit its properties',()=>{
		let parent = new Scope()
		let child = parent.$new()
		child.aValue = [1,2,3]
		expect(parent.aValue).toBeUndefined()
	})	
	it('inherits the parent properties whenever they are defined',()=>{
		let parent = new Scope()
		let child = parent.$new()
		parent.aValue = [1,2,3]

		expect(child.aValue).toEqual([1,2,3])
	})	
	it('can manipulate a paret scope property',()=>{
		let parent = new Scope()
		let child = parent.$new()
		parent.aValue = [1,2,3]

		child.aValue.push(4)
		expect(parent.aValue).toEqual([1,2,3,4])
		expect(child.aValue).toEqual([1,2,3,4])

	})
	it('can watch a property in the parent',()=>{
		let parent = new Scope()
		let child = parent.$new()
		parent.aValue = [1,2,3]
		child.counter = 0

		child.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
			scope.counter++
		},true)

		child.$digest()
		expect(child.counter).toBe(1)
		parent.aValue.push(4)
		child.$digest()
		expect(child.counter).toBe(2)
	})
	it('can be nested at any depth',()=>{
		let test = new Scope()
		let test1 = test.$new()
		let test2 = test1.$new()
		let test22 = test1.$new()
		let test11 = test.$new()
		let test112 = test11.$new()

		test.aValue = 'mushbroom'
		expect(test1.aValue).toBe('mushbroom')
		expect(test2.aValue).toBe('mushbroom')
		expect(test22.aValue).toBe('mushbroom')
		expect(test11.aValue).toBe('mushbroom')
		expect(test112.aValue).toBe('mushbroom')
		test11.anotherValue = 'woniu'
		expect(test112.anotherValue).toBe('woniu')
		expect(test1.anotherValue).toBeUndefined()
		expect(test2.anotherValue).toBeUndefined()

		// expect(test1.aValue).toBe('mushbroom')
		// expect(test1.aValue).toBe('mushbroom')

	})
	it('shadows a parent property with the same name',()=>{
		let parent = new Scope()
		let child = parent.$new()
		parent.name = 'woniu'
		child.name = 'mushbroom'
		expect(child.name).toBe('mushbroom')
		expect(parent.name).toBe('woniu')
	})
	it('does not shadows a parent property with object',()=>{
		let parent = new Scope()
		let child = parent.$new()
		parent.user = {'name':'woniu'}
		child.user.name = 'mushbroom'
		expect(child.user.name).toBe('mushbroom')
		expect(parent.user.name).toBe('mushbroom')
	})
	it('does not digest its parent',()=>{
		let parent = new Scope()
		let child = parent.$new()
		parent.aValue = 'woniu'
		parent.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
			scope.aValueWas = newVal
		})

		child.$digest()
		expect(child.aValueWas).toBeUndefined()
	})
	it('keeps a record of its children',()=>{
		let parent = new Scope()
		let child1 = parent.$new()
		let child2 = parent.$new()
		let child2_1 = child2.$new()

		expect(parent.$$children.length).toBe(2)
		expect(parent.$$children[0]).toBe(child1)
		expect(parent.$$children[1]).toBe(child2)
		expect(child1.$$children.length).toBe(0)
		expect(child2.$$children.length).toBe(1)
		expect(child2.$$children[0]).toBe(child2_1)

	})
	it('digests its children',()=>{
		let parent = new Scope()
		let child = parent.$new()
		parent.aValue = 'woniu'
		child.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
			scope.aValueWas = newVal
		})

		parent.$digest()
		expect(child.aValueWas).toBe('woniu')
	})
	it('digests from root on $apply',()=>{
		let parent = new Scope()
		let child = parent.$new()
		let child2 = child.$new()

		parent.aValue = 'woniu'
		parent.counter = 0
		parent.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
			scope.counter++
		})

		child2.$apply(()=>{})
		expect(parent.counter).toBe(1)
	})
	it('schedules a digest from root on $evalAsync',(done)=>{
		let parent = new Scope()
		let child = parent.$new()
		let child2 = child.$new()
		parent.aValue = 'woniu'
		parent.counter = 0
		parent.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
			scope.counter++
		})

		child2.$evalAsync(()=>{})
		setTimeout(()=>{
			expect(parent.counter).toBe(1)
			done()
		},50)

	})
	it('cannot watch parent attributes when isolated',()=>{
		let parent = new Scope()
		let child = parent.$new(true)
		parent.aValue = 'woniu'
		child.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
			scope.aValueWas = newVal
		})

		child.$digest()
		expect(child.aValueWas).toBeUndefined()
	})
})































});