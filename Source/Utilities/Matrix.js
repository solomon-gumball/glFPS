module.exports = {
    _stacks: {},

    registerStack: function registerStack(stackName) {
        if (this._stacks[stackName]) throw 'Stack ' + stackName + ' already exists!';
        else this._stacks[stackName] = [];
    },

    pushMatrix: function pushMatrix(matrix, stackName) {
        var copy = mat4.create();
        mat4.set(matrix, copy);
        this._stacks[stackName].push(copy);
    },

    popMatrix: function popMatrix(stackName) {
        if (this._stacks[stackName].length === 0) throw "Invalid popMatrix!";
        mvMatrix = this._stacks[stackName].pop();
    }
}