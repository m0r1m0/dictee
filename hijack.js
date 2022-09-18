const parseMock = JSON.parse;
const stringifyMock = JSON.stringify;

JSON.parse = function () {
  const data = parseMock.apply(this, arguments);
  if (data && data.result && data.result.timedtexttracks) {
    window.dispatchEvent(new CustomEvent('DICTEE_DOWNLOADURL_RECEIVED', {detail: data.result}));
  }
  return data;
}

JSON.stringify = function (response) {
  if (!response) return stringifyMock.apply(this, arguments)
  const data = parseMock(stringifyMock.apply(this, arguments))

  let modified = false
  if (data && data.params && data.params.showAllSubDubTracks != null) {
    data.params.showAllSubDubTracks = true
    modified = true
  }
  if (data && data.params && data.params.profiles) {
    data.params.profiles.push('webvtt-lssdh-ios8')
    modified = true
  }

  return modified ? stringifyMock(data) : stringifyMock.apply(this, arguments)
}