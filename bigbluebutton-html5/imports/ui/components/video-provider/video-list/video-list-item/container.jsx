import React from 'react';
import PropTypes from 'prop-types';
import { withTracker } from 'meteor/react-meteor-data';
import VoiceUsers from '/imports/api/voice-users/';
import Users from '/imports/api/users/';
import VideoListItem from './component';
import { layoutSelect, layoutDispatch } from '/imports/ui/components/layout/context';

const VideoListItemContainer = (props) => {
  const { cameraId } = props;

  const fullscreen = layoutSelect((i) => i.fullscreen);
  const { element } = fullscreen;
  const isFullscreenContext = (element === cameraId);
  const layoutContextDispatch = layoutDispatch();

  return (
    <VideoListItem
      {...props}
      {...{
        isFullscreenContext,
        layoutContextDispatch,
      }}
    />
  );
};

export default withTracker((props) => {
  const {
    userId,
  } = props;

  return {
    voiceUser: VoiceUsers.findOne({ intId: userId },
      {
        fields: {
          muted: 1, listenOnly: 1, talking: 1, joined: 1,
        },
      }),
    user: Users.findOne({ intId: userId }, {
      fields: {
        pin: 1,
        userId: 1,
        name: 1,
        avatar: 1,
        role: 1,
        color: 1,
        emoji: 1,
        presenter: 1,
        clientType: 1,
      },
    }),
  };
})(VideoListItemContainer);

VideoListItemContainer.propTypes = {
  cameraId: PropTypes.string.isRequired,
};
