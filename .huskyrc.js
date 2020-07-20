const tasks = (arr) => arr.join(' && ')

module.exports = {
    hooks: {
        'pre-commit': tasks([
            'node scripts/check_merge_commit.js',
            'lint-staged',
        ]),
        // 'commit-msg': 'node scripts/check_commit_msg.js $HUSKY_GIT_PARAMS',
    },
}
