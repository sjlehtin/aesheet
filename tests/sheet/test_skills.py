import logging

from django.test import TestCase

import sheet.factories as factories

logger = logging.getLogger(__name__)


class SkillTestCase(TestCase):
    def test_skill_level_limits_calculation(self):
        """
        Current data in sheet has specialization skills in the following
        format, which the cost for the 0 level as 0.

        It should be changed to None (null) in the future, to underline
        that the skill cannot be purchased at that level.
        """
        skill = factories.SkillFactory(name="Sword", skill_cost_0=0,
                                       skill_cost_1=2,
                                       is_specialization=True)
        assert skill.get_minimum_level() == 1
        assert skill.get_maximum_level() == 8

        forgery = factories.SkillFactory(name="Data forgery", skill_cost_0=0,
                                       skill_cost_1=2,
                                       skill_cost_2=0,
                                       skill_cost_3=0,
                                       is_specialization=True)
        assert forgery.get_minimum_level() == 1
        assert forgery.get_maximum_level() == 1

        # This is a badly defined skill, but can happen during skill restructuring.
        skill2 = factories.SkillFactory(name="Data Archaeology",
                                        skill_cost_0=None,
                                        skill_cost_1=0,
                                        skill_cost_2=0,
                                        skill_cost_3=0,
                                        is_specialization=True)
        assert skill2.get_minimum_level() == 0
        assert skill2.get_maximum_level() == 0
