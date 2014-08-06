var MemberList = {

	clear: function () {
		log('Clearing member list...');
		Data.members = [];
		Data.ui.members.empty();
	},

	addMember: function (memberToAdd) {
		log('Adding member: ' + memberToAdd.name + '...');
		MemberList.removeMember(memberToAdd.id);
		Data.members.push(memberToAdd);
	},

	removeMember: function (memberToRemoveId) {
		var memberToRemove = MemberList.findMember(memberToRemoveId);
		if (memberToRemove) {
			log('Removing member: ' + memberToRemove.name + '...');
			Data.members.splice(Data.members.indexOf(memberToRemove), 1);
		}
	},

	findMember: function (memberId) {
		for (var index in Data.members) {
			if (Data.members[index].id === memberId) return Data.members[index];
		}
		return false;
	},

	findMemberElement: function (memberId) {
		var foundMemberElement = Data.ui.members.find('.member-' + memberId);
		return foundMemberElement || false;
	},

	renderSingleMember: function (member) {
		log('Rendering member: ' + member.name + ' (single)...');
		MemberList.addUiProperties(member);
		var existingMemberElement = Data.ui.members.find('#member-' + member.id);
		if (existingMemberElement.length) {
			existingMemberElement.after($(member.html)).remove();
		} else {
			Data.ui.members.append($(member.html));
		}
	},

	sortAndRenderAll: function () {
		log('Sorting and rendering all members...');

		Data.members.sort(function (member1, member2) {
			if (member1[Data.state.memberSortOrder.property] < member2[Data.state.memberSortOrder.property]) {
				return Data.state.memberSortOrder.order === 'asc' ? -1 : 1;
			} if (member1[Data.state.memberSortOrder.property] > member2[Data.state.memberSortOrder.property]) {
				return Data.state.memberSortOrder.order === 'asc' ? 1 : -1;
			} else {
				return 0;
			}
		});

		Data.ui.members.empty();
		Data.members.forEach(function (member) {
			log('Rendering member: ' + member.name + ' (batch)...');
			MemberList.addUiProperties(member);
			Data.ui.members.append($(member.html));
		});
	},

	addUiProperties: function (member) {
		member.shipIcon = Util.getShipIcon(member.shipType);
		member.html = Data.templates.member(member);
	}
};